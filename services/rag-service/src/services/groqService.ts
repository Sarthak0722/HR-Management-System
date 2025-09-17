import axios from 'axios';
import { HRPolicy, QAResponse } from '../types';
import logger from '../utils/logger';

class GroqService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('GROQ_API_KEY not provided. RAG service will not work properly.');
    }
  }

  async generateAnswer(question: string, contextPolicies: HRPolicy[]): Promise<QAResponse> {
    if (!this.apiKey) {
      logger.warn('Groq API key not configured, providing fallback response');
      return this.generateFallbackAnswer(question, contextPolicies);
    }

    try {
      // Prepare context from relevant policies
      const context = contextPolicies
        .map(policy => `Title: ${policy.title}\nContent: ${policy.content}\nCategory: ${policy.category}`)
        .join('\n\n');

      const prompt = `You are an HR assistant. Answer the following question based on the provided HR policies. If the answer is not in the policies, say so clearly.

HR Policies:
${context}

Question: ${question}

Please provide a clear, helpful answer based on the HR policies above. If the information is not available in the policies, please state that clearly.`;

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful HR assistant. Provide accurate information based on the given HR policies.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.1,
          top_p: 0.9,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const answer = response.data.choices[0]?.message?.content || 'No answer generated';
      
      // Calculate confidence based on context relevance
      const confidence = this.calculateConfidence(question, contextPolicies);

      logger.info('Generated answer using Groq API', {
        question: question.substring(0, 100),
        answerLength: answer.length,
        confidence,
        sourcesCount: contextPolicies.length,
      });

      return {
        answer,
        sources: contextPolicies,
        confidence,
      };
    } catch (error) {
      logger.error('Failed to generate answer with Groq API:', error);
      throw new Error('Failed to generate answer');
    }
  }

  private calculateConfidence(question: string, sources: HRPolicy[]): number {
    // Simple confidence calculation based on number of relevant sources
    // In a real implementation, you might use more sophisticated methods
    if (sources.length === 0) return 0;
    if (sources.length >= 3) return 0.9;
    if (sources.length === 2) return 0.7;
    return 0.5;
  }

  private generateFallbackAnswer(question: string, contextPolicies: HRPolicy[]): QAResponse {
    // Simple keyword-based fallback when Groq API is not available
    const questionLower = question.toLowerCase();
    
    // Find the most relevant policy based on keyword matching
    let bestMatch = contextPolicies[0];
    let maxScore = 0;
    
    for (const policy of contextPolicies) {
      let score = 0;
      const policyText = `${policy.title} ${policy.content}`.toLowerCase();
      
      // Simple keyword scoring
      const keywords = questionLower.split(/\s+/);
      for (const keyword of keywords) {
        if (policyText.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = policy;
      }
    }
    
    // Generate a simple answer based on the best match
    let answer = `Based on our HR policies, here's what I found:\n\n`;
    answer += `**${bestMatch.title}**\n`;
    answer += `${bestMatch.content}\n\n`;
    
    if (contextPolicies.length > 1) {
      answer += `I found ${contextPolicies.length} relevant policies. `;
    }
    
    answer += `For more specific information, please contact HR directly.`;
    
    return {
      answer,
      sources: contextPolicies,
      confidence: maxScore > 0 ? 0.7 : 0.3,
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Groq API connection test failed:', error);
      return false;
    }
  }
}

export default new GroqService();
