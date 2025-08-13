import { ethers } from 'ethers';
import config from '../config';

interface ContractAddresses {
  securityRegistry: string;
  securityToken: string;
  transactionFirewall: string;
  communityReporting: string;
}

export class ContractIntegrationService {
  private provider: ethers.providers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;
  private contracts: {
    securityRegistry?: ethers.Contract;
    securityToken?: ethers.Contract;
    transactionFirewall?: ethers.Contract;
    communityReporting?: ethers.Contract;
  } = {};

  private readonly contractAddresses: ContractAddresses = {
    securityRegistry: process.env.SECURITY_REGISTRY_ADDRESS || '',
    securityToken: process.env.SECURITY_TOKEN_ADDRESS || '',
    transactionFirewall: process.env.TRANSACTION_FIREWALL_ADDRESS || '',
    communityReporting: process.env.COMMUNITY_REPORTING_ADDRESS || '',
  };

  private readonly abis = {
    securityRegistry: [
      "function updateSecurityScore(address target, uint256 riskScore, string[] memory riskFactors) external",
      "function reportScamAddress(address target, string memory reason, string memory evidence) external",
      "function getSecurityData(address target) external view returns (uint256 riskScore, bool isBlacklisted, uint256 lastUpdated, uint256 reportCount, string[] memory riskFactors)",
      "function isBlacklisted(address target) external view returns (bool)",
      "function getRiskScore(address target) external view returns (uint256)",
      "function recordThreatBlocked(address user) external",
      "event SecurityScoreUpdated(address indexed target, uint256 oldScore, uint256 newScore, address indexed analyzer)",
      "event AddressBlacklisted(address indexed target, string reason)"
    ],
    securityToken: [
      "function rewardThreatBlocked(address user) external",
      "function rewardValidReport(address reporter) external",
      "function rewardAnalysis(address analyzer) external",
      "function penalizeScamInteraction(address user) external",
      "function balanceOf(address account) external view returns (uint256)",
      "function totalSupply() external view returns (uint256)",
      "event RewardMinted(address indexed user, uint256 amount, string reason)"
    ],
    transactionFirewall: [
      "function safeExecute(address target, bytes calldata data, uint256 value) external payable returns (bytes32)",
      "function getTransactionData(bytes32 txId) external view returns (address target, bytes memory data, uint256 value, uint256 timestamp, bool executed, uint256 riskScore)",
      "event TransactionBlocked(bytes32 indexed txId, address indexed user, address indexed target, uint256 riskScore, string reason)",
      "event TransactionExecuted(bytes32 indexed txId, address indexed user, bool success)"
    ],
    communityReporting: [
      "function submitReport(address target, string memory category, string memory description, string memory evidence, uint256 stake) external returns (uint256)",
      "function getReport(uint256 reportId) external view returns (address reporter, address target, string memory category, string memory description, string memory evidence, uint256 stake, uint256 timestamp, uint8 status, uint256 votesFor, uint256 votesAgainst)",
      "event ReportSubmitted(uint256 indexed reportId, address indexed reporter, address indexed target, string category)"
    ]
  };

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(config.blockchain.baseRpcUrl);
    
    if (process.env.PRIVATE_KEY) {
      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      this.initializeContracts();
    }
  }

  private initializeContracts(): void {
    if (!this.signer) return;

    try {
      if (this.contractAddresses.securityRegistry) {
        this.contracts.securityRegistry = new ethers.Contract(
          this.contractAddresses.securityRegistry,
          this.abis.securityRegistry,
          this.signer
        );
      }

      if (this.contractAddresses.securityToken) {
        this.contracts.securityToken = new ethers.Contract(
          this.contractAddresses.securityToken,
          this.abis.securityToken,
          this.signer
        );
      }

      if (this.contractAddresses.transactionFirewall) {
        this.contracts.transactionFirewall = new ethers.Contract(
          this.contractAddresses.transactionFirewall,
          this.abis.transactionFirewall,
          this.signer
        );
      }

      if (this.contractAddresses.communityReporting) {
        this.contracts.communityReporting = new ethers.Contract(
          this.contractAddresses.communityReporting,
          this.abis.communityReporting,
          this.signer
        );
      }

      console.log('✅ Smart contracts initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize contracts:', error);
    }
  }

  async updateOnChainSecurityScore(
    targetAddress: string,
    riskScore: number,
    riskFactors: string[]
  ): Promise<boolean> {
    try {
      if (!this.contracts.securityRegistry) {
        console.warn('SecurityRegistry contract not available');
        return false;
      }

      const tx = await this.contracts.securityRegistry.updateSecurityScore(
        targetAddress,
        riskScore,
        riskFactors,
        { gasLimit: 200000 }
      );

      await tx.wait();
      console.log(`✅ Updated on-chain security score for ${targetAddress}: ${riskScore}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update on-chain security score:', error);
      return false;
    }
  }

  async reportScamOnChain(
    targetAddress: string,
    reason: string,
    evidence: string
  ): Promise<boolean> {
    try {
      if (!this.contracts.securityRegistry) {
        console.warn('SecurityRegistry contract not available');
        return false;
      }

      const tx = await this.contracts.securityRegistry.reportScamAddress(
        targetAddress,
        reason,
        evidence,
        { gasLimit: 150000 }
      );

      await tx.wait();
      console.log(`✅ Reported scam address on-chain: ${targetAddress}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to report scam on-chain:', error);
      return false;
    }
  }

  async rewardThreatBlocked(userAddress: string): Promise<boolean> {
    try {
      if (!this.contracts.securityToken || !this.contracts.securityRegistry) {
        console.warn('Required contracts not available');
        return false;
      }

      const [tx1, tx2] = await Promise.all([
        this.contracts.securityToken.rewardThreatBlocked(userAddress, { gasLimit: 100000 }),
        this.contracts.securityRegistry.recordThreatBlocked(userAddress, { gasLimit: 80000 })
      ]);

      await Promise.all([tx1.wait(), tx2.wait()]);
      console.log(`✅ Rewarded user for blocking threat: ${userAddress}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to reward threat blocked:', error);
      return false;
    }
  }

  async rewardValidReport(reporterAddress: string): Promise<boolean> {
    try {
      if (!this.contracts.securityToken) {
        console.warn('SecurityToken contract not available');
        return false;
      }

      const tx = await this.contracts.securityToken.rewardValidReport(
        reporterAddress,
        { gasLimit: 100000 }
      );

      await tx.wait();
      console.log(`✅ Rewarded valid report: ${reporterAddress}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to reward valid report:', error);
      return false;
    }
  }

  async penalizeScamInteraction(userAddress: string): Promise<boolean> {
    try {
      if (!this.contracts.securityToken) {
        console.warn('SecurityToken contract not available');
        return false;
      }

      const tx = await this.contracts.securityToken.penalizeScamInteraction(
        userAddress,
        { gasLimit: 100000 }
      );

      await tx.wait();
      console.log(`✅ Penalized scam interaction: ${userAddress}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to penalize scam interaction:', error);
      return false;
    }
  }

  async getOnChainSecurityData(address: string): Promise<{
    riskScore: number;
    isBlacklisted: boolean;
    lastUpdated: number;
    reportCount: number;
    riskFactors: string[];
  } | null> {
    try {
      if (!this.contracts.securityRegistry) {
        console.warn('SecurityRegistry contract not available');
        return null;
      }

      const result = await this.contracts.securityRegistry.getSecurityData(address);
      
      return {
        riskScore: result.riskScore.toNumber(),
        isBlacklisted: result.isBlacklisted,
        lastUpdated: result.lastUpdated.toNumber(),
        reportCount: result.reportCount.toNumber(),
        riskFactors: result.riskFactors
      };
    } catch (error) {
      console.error('❌ Failed to get on-chain security data:', error);
      return null;
    }
  }

  async getUserTokenBalance(userAddress: string): Promise<number> {
    try {
      if (!this.contracts.securityToken) {
        console.warn('SecurityToken contract not available');
        return 0;
      }

      const balance = await this.contracts.securityToken.balanceOf(userAddress);
      return parseFloat(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('❌ Failed to get user token balance:', error);
      return 0;
    }
  }

  async submitCommunityReport(
    reporterAddress: string,
    targetAddress: string,
    category: string,
    description: string,
    evidence: string,
    stakeAmount: string
  ): Promise<number | null> {
    try {
      if (!this.contracts.communityReporting) {
        console.warn('CommunityReporting contract not available');
        return null;
      }

      const tx = await this.contracts.communityReporting.submitReport(
        targetAddress,
        category,
        description,
        evidence,
        ethers.utils.parseEther(stakeAmount),
        { gasLimit: 300000 }
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find((e: any) => e.event === 'ReportSubmitted');
      
      if (event) {
        const reportId = event.args?.reportId?.toNumber();
        console.log(`✅ Community report submitted: ID ${reportId}`);
        return reportId;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to submit community report:', error);
      return null;
    }
  }

  isContractsInitialized(): boolean {
    return !!(
      this.contracts.securityRegistry &&
      this.contracts.securityToken &&
      this.contracts.transactionFirewall &&
      this.contracts.communityReporting
    );
  }

  getContractAddresses(): ContractAddresses {
    return this.contractAddresses;
  }

  async getNetworkInfo(): Promise<{
    chainId: number;
    blockNumber: number;
    gasPrice: string;
  }> {
    try {
      const [network, blockNumber, gasPrice] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber(),
        this.provider.getGasPrice()
      ]);

      return {
        chainId: network.chainId,
        blockNumber,
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei')
      };
    } catch (error) {
      console.error('❌ Failed to get network info:', error);
      return {
        chainId: 0,
        blockNumber: 0,
        gasPrice: '0'
      };
    }
  }
}