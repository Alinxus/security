import axios from 'axios';
import { ContractInfo } from '../types';
import config from '../config';

export class BaseRPCService {
  private rpcUrl: string;

  constructor() {
    this.rpcUrl = config.blockchain.baseRpcUrl;
  }

  /**
   * Make RPC call to Base network
   */
  private async makeRPCCall(method: string, params: any[]): Promise<any> {
    try {
      const response = await axios.post(
        this.rpcUrl,
        {
          jsonrpc: '2.0',
          method,
          params,
          id: Date.now(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message}`);
      }

      return response.data.result;
    } catch (error: any) {
      console.error(`❌ Base RPC call failed (${method}):`, error.message);
      throw error;
    }
  }

  /**
   * Get contract code and information
   */
  async getContractInfo(address: string): Promise<ContractInfo> {
    console.log(`🔗 Fetching contract info from Base: ${address}`);

    try {
      // Get contract code
      const code = await this.makeRPCCall('eth_getCode', [address, 'latest']);
      const isContract = code && code !== '0x';

      // Get contract creation transaction (if available)
      let creator: string | undefined;
      let createdAt: Date | undefined;

      if (isContract) {
        try {
          // This is a simplified approach - in production, you might want to use
          // more sophisticated methods to get contract creation info
          const trace = await this.makeRPCCall('debug_traceTransaction', [address]);
          creator = trace?.from;
          createdAt = new Date(); // Would need to get actual block timestamp
        } catch (error) {
          // Trace API might not be available on all nodes
          console.warn('⚠️ Could not fetch contract creation info');
        }
      }

      return {
        address: address.toLowerCase(),
        isContract,
        sourceCode: undefined, // Would need Etherscan-like API for source code
        abi: undefined,
        verified: false, // Would need to check verification status
        createdAt,
        creator,
        name: undefined,
      };
    } catch (error: any) {
      console.error(`❌ Failed to fetch contract info for ${address}:`, error.message);
      
      // Return minimal info on failure
      return {
        address: address.toLowerCase(),
        isContract: false,
        verified: false,
      };
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.makeRPCCall('eth_getBalance', [address, 'latest']);
      return balance;
    } catch (error) {
      return '0';
    }
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(address: string): Promise<number> {
    try {
      const count = await this.makeRPCCall('eth_getTransactionCount', [address, 'latest']);
      return parseInt(count, 16);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get latest block number
   */
  async getBlockNumber(): Promise<number> {
    try {
      const blockNumber = await this.makeRPCCall('eth_blockNumber', []);
      return parseInt(blockNumber, 16);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(transaction: {
    from: string;
    to: string;
    value?: string;
    data?: string;
  }): Promise<string> {
    try {
      const gasEstimate = await this.makeRPCCall('eth_estimateGas', [transaction]);
      return gasEstimate;
    } catch (error: any) {
      console.warn(`⚠️ Gas estimation failed: ${error.message}`);
      return '21000'; // Default gas limit
    }
  }

  /**
   * Call contract method (read-only)
   */
  async call(transaction: {
    to: string;
    data: string;
  }, blockTag: string = 'latest'): Promise<string> {
    try {
      const result = await this.makeRPCCall('eth_call', [transaction, blockTag]);
      return result;
    } catch (error: any) {
      console.error(`❌ Contract call failed: ${error.message}`);
      return '0x';
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    try {
      const receipt = await this.makeRPCCall('eth_getTransactionReceipt', [txHash]);
      return receipt;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.makeRPCCall('eth_gasPrice', []);
      return gasPrice;
    } catch (error) {
      return '0x4a817c800'; // 20 gwei fallback
    }
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: string): Promise<boolean> {
    try {
      const code = await this.makeRPCCall('eth_getCode', [address, 'latest']);
      return code && code !== '0x';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get ERC-20 token info (if address is a token contract)
   */
  async getTokenInfo(contractAddress: string): Promise<{
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: string;
  } | null> {
    try {
      if (!(await this.isContract(contractAddress))) {
        return null;
      }

      // ERC-20 function signatures
      const nameSignature = '0x06fdde03'; // name()
      const symbolSignature = '0x95d89b41'; // symbol()
      const decimalsSignature = '0x313ce567'; // decimals()
      const totalSupplySignature = '0x18160ddd'; // totalSupply()

      const [nameResult, symbolResult, decimalsResult, totalSupplyResult] = await Promise.allSettled([
        this.call({ to: contractAddress, data: nameSignature }),
        this.call({ to: contractAddress, data: symbolSignature }),
        this.call({ to: contractAddress, data: decimalsSignature }),
        this.call({ to: contractAddress, data: totalSupplySignature }),
      ]);

      return {
        name: this.decodeStringResult(nameResult.status === 'fulfilled' ? nameResult.value : undefined),
        symbol: this.decodeStringResult(symbolResult.status === 'fulfilled' ? symbolResult.value : undefined),
        decimals: decimalsResult.status === 'fulfilled' ? parseInt(decimalsResult.value, 16) : undefined,
        totalSupply: totalSupplyResult.status === 'fulfilled' ? totalSupplyResult.value : undefined,
      };
    } catch (error) {
      console.error(`❌ Failed to get token info for ${contractAddress}`);
      return null;
    }
  }

  /**
   * Decode string result from contract call
   */
  private decodeStringResult(result?: string): string | undefined {
    if (!result || result === '0x') return undefined;
    
    try {
      // Simple string decoding - in production, use a proper ABI decoder
      const hex = result.slice(2);
      const length = parseInt(hex.slice(64, 128), 16);
      const stringHex = hex.slice(128, 128 + length * 2);
      return Buffer.from(stringHex, 'hex').toString('utf8');
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Health check for Base RPC connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getBlockNumber();
      return true;
    } catch (error) {
      return false;
    }
  }
}
