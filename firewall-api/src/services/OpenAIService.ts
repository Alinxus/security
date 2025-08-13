import OpenAI from 'openai';
import { AIAnalysis } from '../types';
import config from '../config';

export class OpenAIService {
  private client: OpenAI | null = null;

  constructor() {
    if (config.apis.openai.apiKey && config.apis.openai.apiKey !== 'sk-demo-key') {
      this.client = new OpenAI({
        apiKey: config.apis.openai.apiKey,
      });
    }
  }

  /**
   * Analyze smart contract using GPT-4
   */
  async analyzeContract(contractAddress: string, transactionData?: string, sourceCode?: string): Promise<AIAnalysis> {
    console.log(`🤖 AI analyzing contract via OpenAI: ${contractAddress}`);
    
    try {
      if (!this.client) {
        console.warn('⚠️ OpenAI API key not configured, using mock analysis');
        return this.getMockAnalysis();
      }

      const prompt = this.generateAnalysisPrompt(contractAddress, transactionData, sourceCode);
      
      const completion = await this.client.chat.completions.create({
        model: config.apis.openai.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.apis.openai.maxTokens,
        temperature: config.apis.openai.temperature,
        timeout: config.timeouts.aiAnalysis,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return this.parseAIResponse(response);

    } catch (error: any) {
      console.error('❌ OpenAI analysis failed:', error.message);
      
      if (error.status === 401) {
        console.error('❌ Invalid OpenAI API key');
      } else if (error.status === 429) {
        console.error('❌ OpenAI rate limit exceeded');
      }
      
      return {
        contractRisk: 25,
        riskFactors: ['AI analysis failed - using conservative risk score'],
        explanation: `AI analysis unavailable: ${error.message}`,
        confidence: 0,
        patterns: []
      };
    }
  }

  /**
   * Generate detailed analysis prompt for GPT-4
   */
  private generateAnalysisPrompt(contractAddress: string, transactionData?: string, sourceCode?: string): string {
    return `
Analyze this Ethereum smart contract for security risks and malicious patterns:

CONTRACT ADDRESS: ${contractAddress}
TRANSACTION DATA: ${transactionData || 'N/A'}
SOURCE CODE: ${sourceCode ? 'Available' : 'Not available (analyze based on transaction data)'}

${sourceCode ? `\nSOURCE CODE:\n${sourceCode}` : ''}

ANALYSIS REQUIREMENTS:
1. Identify specific security risks and vulnerabilities
2. Look for common attack patterns (honeypots, rug pulls, hidden fees)
3. Check for unusual ownership controls or backdoors
4. Analyze token economics and transfer restrictions
5. Assess transaction fee mechanisms
6. Check for pause/unpause functionality misuse
7. Identify any obfuscation techniques

RESPONSE FORMAT:
Provide your analysis in the following JSON format:
{
  "riskScore": <number 0-100>,
  "riskFactors": ["factor1", "factor2", ...],
  "explanation": "<detailed explanation>",
  "confidence": <number 0-100>,
  "patterns": ["pattern1", "pattern2", ...]
}

Be specific about risks found and provide actionable insights.
    `.trim();
  }

  /**
   * System prompt to guide GPT-4 behavior
   */
  private getSystemPrompt(): string {
    return `
You are an expert blockchain security auditor specializing in Ethereum smart contract analysis.
Your task is to identify security risks, scams, and malicious patterns in smart contracts.

KEY FOCUS AREAS:
- Honeypot detection (can buy but can't sell)
- Rug pull mechanisms (owner can drain funds)
- Hidden fees and tax mechanisms
- Ownership privilege abuse
- Access control vulnerabilities
- Token transfer restrictions
- Price manipulation mechanisms
- Proxy upgrade risks

SCORING GUIDELINES:
- 0-20: Very safe, standard patterns
- 21-40: Low risk, minor concerns
- 41-60: Medium risk, notable issues
- 61-80: High risk, significant problems
- 81-100: Critical risk, likely malicious

Always provide specific, actionable insights. Be conservative in your risk assessment.
If you cannot determine the risk level with confidence, err on the side of caution.
    `.trim();
  }

  /**
   * Parse GPT-4 response into structured format
   */
  private parseAIResponse(response: string): AIAnalysis {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          contractRisk: Math.min(Math.max(parsed.riskScore || 0, 0), 100),
          riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
          explanation: parsed.explanation || response,
          confidence: Math.min(Math.max(parsed.confidence || 50, 0), 100),
          patterns: Array.isArray(parsed.patterns) ? parsed.patterns : []
        };
      } else {
        // Fallback: analyze text response for risk indicators
        return this.parseTextResponse(response);
      }
    } catch (error) {
      console.warn('⚠️ Failed to parse structured AI response, using text analysis');
      return this.parseTextResponse(response);
    }
  }

  /**
   * Parse unstructured text response
   */
  private parseTextResponse(response: string): AIAnalysis {
    const text = response.toLowerCase();
    let riskScore = 20; // Base score
    const riskFactors: string[] = [];
    const patterns: string[] = [];

    // Risk indicators
    const riskIndicators = [
      { pattern: /honeypot|can.t sell|unable to sell/g, score: 70, factor: 'Potential honeypot detected' },
      { pattern: /rug pull|owner can drain|centralized control/g, score: 60, factor: 'Centralization risks' },
      { pattern: /hidden fee|tax|unusual transfer/g, score: 40, factor: 'Hidden fees or taxes' },
      { pattern: /backdoor|malicious|scam/g, score: 80, factor: 'Malicious patterns detected' },
      { pattern: /pause|emergency stop/g, score: 30, factor: 'Emergency controls present' },
      { pattern: /proxy|upgradeable/g, score: 25, factor: 'Upgradeable contract risks' },
    ];

    for (const indicator of riskIndicators) {
      const matches = text.match(indicator.pattern);
      if (matches) {
        riskScore = Math.max(riskScore, indicator.score);
        riskFactors.push(indicator.factor);
        patterns.push(indicator.pattern.source);
      }
    }

    return {
      contractRisk: Math.min(riskScore, 100),
      riskFactors,
      explanation: response,
      confidence: 70,
      patterns
    };
  }

  /**
   * Mock analysis for testing without API key
   */
  private getMockAnalysis(): AIAnalysis {
    return {
      contractRisk: 15,
      riskFactors: [],
      explanation: 'AI analysis not configured - using mock safe result',
      confidence: 0,
      patterns: []
    };
  }

  /**
   * Analyze multiple contracts in batch
   */
  async analyzeContractBatch(addresses: string[]): Promise<AIAnalysis[]> {
    console.log(`🤖 Batch analyzing ${addresses.length} contracts`);
    
    const results = await Promise.allSettled(
      addresses.map(address => this.analyzeContract(address))
    );
    
    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : this.getMockAnalysis()
    );
  }

  /**
   * Check if OpenAI API is configured and working
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Simple test request
      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });

      return completion.choices.length > 0;
    } catch (error) {
      return false;
    }
  }
}
