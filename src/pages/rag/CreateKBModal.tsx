import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { KB, CreateKBDto } from '../../api/rag-schema';

interface Props {
  initial?: KB | null;
  onClose: () => void;
  onSubmit: (dto: CreateKBDto) => void | Promise<void>;
}

export default function CreateKBModal({ initial, onClose, onSubmit }: Props) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [retrievalMode, setRetrievalMode] = useState(initial?.retrievalMode || 'vector');
  const [chunkSize, setChunkSize] = useState(initial?.chunkSize ?? 500);
  const [chunkOverlap, setChunkOverlap] = useState(initial?.chunkOverlap ?? 50);
  const [topK, setTopK] = useState(initial?.topK ?? 5);
  const [vectorWeight, setVectorWeight] = useState(initial?.vectorWeight ?? 0.7);
  const [rerankerEnabled, setRerankerEnabled] = useState(initial?.rerankerEnabled ?? false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        retrievalMode,
        chunkSize,
        chunkOverlap,
        topK,
        vectorWeight,
        rerankerEnabled,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? '编辑知识库' : '新建知识库'}
          </h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {/* Name */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入知识库名称"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可选描述"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Retrieval Mode */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">检索模式</label>
            <select
              value={retrievalMode}
              onChange={(e) => setRetrievalMode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="vector">向量检索</option>
              <option value="keyword">关键词检索</option>
              <option value="hybrid">混合检索</option>
            </select>
          </div>

          {/* Chunk Size & Overlap */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">分块大小</label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                min={100}
                max={2000}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">分块重叠</label>
              <input
                type="number"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                min={0}
                max={500}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* TopK & Vector Weight */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">TopK</label>
              <input
                type="number"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">向量权重</label>
              <input
                type="number"
                value={vectorWeight}
                onChange={(e) => setVectorWeight(Number(e.target.value))}
                min={0}
                max={1}
                step={0.1}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Reranker */}
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">启用 Reranker</label>
            <button
              type="button"
              onClick={() => setRerankerEnabled(!rerankerEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                rerankerEnabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  rerankerEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? '保存中...' : isEdit ? '保存修改' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
