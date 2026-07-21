import { z } from 'zod';

// Knowledge Base schemas
export const kbSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  embeddingProvider: z.string(),
  embeddingModel: z.string(),
  embeddingDimension: z.number(),
  vectorStore: z.string(),
  chunkSize: z.number(),
  chunkOverlap: z.number(),
  topK: z.number(),
  similarityThreshold: z.number(),
  retrievalMode: z.string(),
  vectorWeight: z.number(),
  rrfK: z.number(),
  rerankerEnabled: z.boolean(),
  rerankerProvider: z.string(),
  rerankerModel: z.string(),
  rerankerTopN: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z.object({ documents: z.number() }).optional(),
  documents: z.array(z.any()).optional(),
});

export const kbListResponseSchema = z.array(kbSchema);

export const kbDetailResponseSchema = kbSchema;

export const createKbResponseSchema = kbSchema;

export const updateKbResponseSchema = kbSchema;

export const deleteKbResponseSchema = z.object({ message: z.string().optional() });

// Document schemas
export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number(),
  status: z.string(),
  error: z.string().nullable(),
  knowledgeBaseId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const chunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  chunkIndex: z.number(),
  startIndex: z.number(),
  endIndex: z.number(),
});

export const chunksResponseSchema = z.array(chunkSchema);

export const uploadDocResponseSchema = documentSchema;

// RAG Chat schemas
export const ragChatRequestSchema = z.object({
  query: z.string().min(1),
  knowledgeBaseId: z.string().min(1),
  mode: z.enum(['vector', 'keyword', 'hybrid']).optional(),
  model: z.string().optional(),
});

export const ragSourceSchema = z.object({
  content: z.string(),
  docName: z.string(),
  score: z.number(),
});

// Types
export type KB = z.infer<typeof kbSchema>;
export type Document = z.infer<typeof documentSchema>;
export type Chunk = z.infer<typeof chunkSchema>;
export type RagChatRequest = z.infer<typeof ragChatRequestSchema>;
export type RagSource = z.infer<typeof ragSourceSchema>;

// Create/Update KB DTOs
export interface CreateKBDto {
  name: string;
  description?: string;
  embeddingProvider?: string;
  embeddingModel?: string;
  embeddingDimension?: number;
  vectorStore?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  topK?: number;
  similarityThreshold?: number;
  retrievalMode?: string;
  vectorWeight?: number;
  rrfK?: number;
  rerankerEnabled?: boolean;
  rerankerProvider?: string;
  rerankerModel?: string;
  rerankerTopN?: number;
}

export interface UpdateKBDto extends Partial<CreateKBDto> {}
