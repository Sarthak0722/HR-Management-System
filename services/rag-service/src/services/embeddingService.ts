import { HRPolicy, EmbeddingVector } from '../types';
import logger from '../utils/logger';

class EmbeddingService {
  private embeddings: EmbeddingVector[] = [];

  async initialize() {
    try {
      logger.info('Initializing simple embedding service...');
      logger.info('Embedding service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize embedding service:', error);
      throw error;
    }
  }

  private createSimpleEmbedding(text: string): number[] {
    // Simple keyword-based embedding
    const keywords = [
      'leave', 'vacation', 'sick', 'holiday', 'time off', 'absence',
      'policy', 'procedure', 'guideline', 'rule', 'regulation',
      'employee', 'staff', 'worker', 'personnel', 'hr', 'human resources',
      'approval', 'request', 'application', 'form', 'process',
      'manager', 'supervisor', 'boss', 'leadership', 'authority',
      'benefit', 'compensation', 'salary', 'wage', 'pay',
      'dress code', 'attire', 'clothing', 'appearance', 'uniform',
      'workplace', 'office', 'environment', 'culture', 'atmosphere'
    ];

    const embedding = new Array(keywords.length).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      for (const word of words) {
        if (word.includes(keyword) || keyword.includes(word)) {
          embedding[i] += 1;
        }
      }
    }

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return embedding.map(val => val / magnitude);
    }
    
    return embedding;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.createSimpleEmbedding(text);
  }

  async embedPolicies(policies: HRPolicy[]): Promise<void> {
    logger.info(`Embedding ${policies.length} HR policies...`);
    
    this.embeddings = [];
    
    for (const policy of policies) {
      try {
        const embedding = this.createSimpleEmbedding(`${policy.title} ${policy.content}`);
        this.embeddings.push({
          id: policy.id,
          embedding,
          metadata: policy,
        });
      } catch (error) {
        logger.error(`Failed to embed policy ${policy.id}:`, error);
      }
    }
    
    logger.info(`Successfully embedded ${this.embeddings.length} policies`);
  }

  async findSimilarPolicies(query: string, maxResults: number = 3): Promise<EmbeddingVector[]> {
    if (this.embeddings.length === 0) {
      logger.warn('No embeddings available, returning empty results');
      return [];
    }

    try {
      const queryEmbedding = this.createSimpleEmbedding(query);
      
      // Calculate cosine similarity
      const similarities = this.embeddings.map(item => {
        const similarity = this.cosineSimilarity(queryEmbedding, item.embedding);
        return { ...item, similarity };
      });

      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults)
        .filter(item => item.similarity > 0.1) // Lower threshold for simple embeddings
        .map(({ similarity, ...item }) => item);
    } catch (error) {
      logger.error('Failed to find similar policies:', error);
      throw error;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  getEmbeddingCount(): number {
    return this.embeddings.length;
  }
}

export default new EmbeddingService();