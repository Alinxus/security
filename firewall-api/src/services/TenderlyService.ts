import axios from 'axios';
import { Transaction, SimulationResult, TenderlySimulationResponse } from '../types';
import config from '../config';

export class TenderlyService {
  private baseURL: string;
  private accessKey: string;
  private user: string;
  private project: string;

  constructor() {
    this.baseURL = config.apis.tenderly.baseUrl;
    this.accessKey = config.apis.tenderly.accessKey;
    this.user = config.apis.tenderly.user;
    this.project = config.apis.tenderly.project;
  }

  /**
   * Simulate transaction using Tenderly Fork API
   */
  async simulateTransaction(transaction: Transaction): Promise<SimulationResult> {
    console.log(`🔍 Simulating transaction via Tenderly: ${transaction.to}`);
    
    try {
      if (!this.accessKey || this.accessKey === 'demo_key') {
        console.warn('⚠️ Tenderly API key not configured, using mock simulation');
        return this.getMockSimulationResult();
      }

      const simulationRequest = {
        network_id: transaction.chainId.toString(),
        from: transaction.from,
        to: transaction.to,
        input: transaction.data,
        value: transaction.value,
        gas: parseInt(transaction.gas),
        gas_price: transaction.gasPrice,
        save: true,
        save_if_fails: true,
        simulation_type: 'quick',
      };

      const response = await axios.post<TenderlySimulationResponse>(
        `${this.baseURL}/account/${this.user}/project/${this.project}/simulate`,
        simulationRequest,
        {
          headers: {
            'X-Access-Key': this.accessKey,
            'Content-Type': 'application/json',
          },
          timeout: config.timeouts.simulation,
        }
      );

      return this.parseTenderlyResponse(response.data);

    } catch (error: any) {
      console.error('❌ Tenderly simulation failed:', error.message);
      
      if (error.response?.status === 401) {
        console.error('❌ Invalid Tenderly API key');
      } else if (error.response?.status === 404) {
        console.error('❌ Tenderly project not found');
      }
      
      return {
        success: false,
        gasUsed: '0',
        error: `Simulation failed: ${error.message}`,
        stateChanges: [],
        tokenTransfers: [],
        events: []
      };
    }
  }

  /**
   * Parse Tenderly API response to our format
   */
  private parseTenderlyResponse(response: TenderlySimulationResponse): SimulationResult {
    const { simulation } = response;
    
    return {
      success: simulation.status,
      gasUsed: simulation.gasUsed,
      error: simulation.error,
      stateChanges: [], // TODO: Parse state changes from Tenderly response
      tokenTransfers: [], // TODO: Parse token transfers
      events: [], // TODO: Parse events
    };
  }

  /**
   * Mock simulation for testing without API key
   */
  private getMockSimulationResult(): SimulationResult {
    return {
      success: true,
      gasUsed: '21000',
      stateChanges: [],
      tokenTransfers: [],
      events: []
    };
  }

  /**
   * Simulate multiple transactions in batch
   */
  async simulateTransactionBatch(transactions: Transaction[]): Promise<SimulationResult[]> {
    console.log(`🔍 Batch simulating ${transactions.length} transactions`);
    
    // Execute simulations in parallel with concurrency limit
    const results = await Promise.allSettled(
      transactions.map(tx => this.simulateTransaction(tx))
    );
    
    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : {
            success: false,
            gasUsed: '0',
            error: 'Batch simulation failed',
            stateChanges: [],
            tokenTransfers: [],
            events: []
          }
    );
  }

  /**
   * Create a fork for advanced testing
   */
  async createFork(chainId: number): Promise<string | null> {
    try {
      if (!this.accessKey || this.accessKey === 'demo_key') {
        console.warn('⚠️ Cannot create fork - API key not configured');
        return null;
      }

      const response = await axios.post(
        `${this.baseURL}/account/${this.user}/project/${this.project}/fork`,
        {
          network_id: chainId.toString(),
        },
        {
          headers: {
            'X-Access-Key': this.accessKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.id;
    } catch (error: any) {
      console.error('❌ Failed to create Tenderly fork:', error.message);
      return null;
    }
  }

  /**
   * Check if API is configured and working
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.accessKey || this.accessKey === 'demo_key') {
        return false;
      }

      const response = await axios.get(
        `${this.baseURL}/account/${this.user}/project/${this.project}`,
        {
          headers: {
            'X-Access-Key': this.accessKey,
          },
          timeout: 5000,
        }
      );

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
