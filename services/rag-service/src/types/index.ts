export interface HRPolicy {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EmbeddingVector {
  id: string;
  embedding: number[];
  metadata: HRPolicy;
}

export interface QAResponse {
  answer: string;
  sources: HRPolicy[];
  confidence: number;
}

export interface QARequest {
  question: string;
  maxResults?: number;
}
