import { requestJson } from './client';
import {
  kbListResponseSchema,
  kbDetailResponseSchema,
  createKbResponseSchema,
  updateKbResponseSchema,
  deleteKbResponseSchema,
  uploadDocResponseSchema,
  chunksResponseSchema,
} from './rag-schema';
import type { CreateKBDto, UpdateKBDto } from './rag-schema';

export const ragApi = {
  // ── Knowledge Bases ──

  listKBs() {
    return requestJson('/api/rag/knowledge-bases', {
      scheama: kbListResponseSchema,
    });
  },

  getKB(id: string) {
    return requestJson(`/api/rag/knowledge-bases/${encodeURIComponent(id)}`, {
      scheama: kbDetailResponseSchema,
    });
  },

  createKB(dto: CreateKBDto) {
    return requestJson('/api/rag/knowledge-bases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
      scheama: createKbResponseSchema,
    });
  },

  updateKB(id: string, dto: UpdateKBDto) {
    return requestJson(`/api/rag/knowledge-bases/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
      scheama: updateKbResponseSchema,
    });
  },

  deleteKB(id: string) {
    return requestJson(`/api/rag/knowledge-bases/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      scheama: deleteKbResponseSchema,
    });
  },

  // ── Documents ──

  uploadDoc(kbId: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return requestJson(`/api/rag/documents/upload?knowledgeBaseId=${encodeURIComponent(kbId)}`, {
      method: 'POST',
      body: fd,
      scheama: uploadDocResponseSchema,
    });
  },

  getChunks(docId: string) {
    return requestJson(`/api/rag/documents/${encodeURIComponent(docId)}/chunks`, {
      scheama: chunksResponseSchema,
    });
  },

  // ── RAG Chat (SSE) — direct fetch for streaming ──

  chat(dto: { query: string; knowledgeBaseId: string; mode?: string; model?: string }) {
    return fetch('/api/rag/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },
};
