import { ScamAddress } from '../types';
import { pool } from '../config/database';

export class ScamDatabaseService {
  /**
   * Check if address is in scam database
   */
  async checkAddress(address: string): Promise<ScamAddress | null> {
    console.log(`📊 Checking scam database for ${address}`);
    
    // Demo mode - return null (no scams found)
    if (process.env.DEMO_MODE === 'true') {
      return null;
    }
    
    try {
      const query = 'SELECT * FROM scam_addresses WHERE address = $1';
      const result = await pool.query(query, [address.toLowerCase()]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        address: row.address,
        riskLevel: row.risk_level,
        description: row.description,
        reportedAt: row.reported_at,
        source: row.source,
        tags: row.tags || []
      };
      
    } catch (error) {
      console.warn('⚠️ Scam database check failed:', error);
      return null;
    }
  }

  /**
   * Add address to scam database
   */
  async addScamAddress(scamAddress: Omit<ScamAddress, 'reportedAt'>): Promise<boolean> {
    try {
      const query = `
        INSERT INTO scam_addresses (address, risk_level, description, source, tags)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (address) 
        DO UPDATE SET 
          risk_level = EXCLUDED.risk_level,
          description = EXCLUDED.description,
          source = EXCLUDED.source,
          tags = EXCLUDED.tags,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      await pool.query(query, [
        scamAddress.address.toLowerCase(),
        scamAddress.riskLevel,
        scamAddress.description,
        scamAddress.source,
        scamAddress.tags
      ]);
      
      console.log(`✅ Added/updated scam address: ${scamAddress.address}`);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to add scam address:', error);
      return false;
    }
  }

  /**
   * Load known scam addresses from external sources
   */
  async loadKnownScamAddresses(): Promise<void> {
    console.log('📥 Loading known scam addresses...');
    
    try {
      // TODO: Implement Chainabase API integration
      // For now, add some example scam addresses
      
      const knownScams = [
        {
          address: '0x0000000000000000000000000000000000000000',
          riskLevel: 100,
          description: 'Null address - often used in scams',
          source: 'internal',
          tags: ['null-address', 'scam']
        },
        // Add more known scam addresses here
      ];
      
      for (const scam of knownScams) {
        await this.addScamAddress(scam);
      }
      
      console.log(`✅ Loaded ${knownScams.length} known scam addresses`);
      
    } catch (error) {
      console.error('❌ Failed to load scam addresses:', error);
    }
  }

  /**
   * TODO: Implement Chainabase API integration
   */
  private async fetchFromChainabase(): Promise<any[]> {
    // This will be implemented with actual Chainabase API calls
    throw new Error('Chainabase integration not yet implemented');
  }
}
