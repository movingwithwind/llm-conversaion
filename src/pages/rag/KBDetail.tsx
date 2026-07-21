import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Loader2, Upload, FileText, Trash2, ChevronDown, ChevronRight,
  Settings2, Copy, Check,
} from 'lucide-react';
import { ragApi } from '../../api/rag';
import type { KB, Document, Chunk } from '../../api/rag-schema';
import CreateKBModal from './CreateKBModal';
import type { CreateKBDto } from '../../api/rag-schema';

export default function KBDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [kb, setKb] = useState<KB | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragover, setDragover] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [docChunks, setDocChunks] = useState<Record<string, Chunk[]>>({});
  const [loadingChunks, setLoadingChunks] = useState<Set<string>>(new Set());

  const fetchKB = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await ragApi.getKB(id);
      setKb(data);
    } catch (e: any) {
      toast.error(e.message || '加载知识库失败');
      navigate('/rag');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchKB();
  }, [fetchKB]);

  const handleUpload = async (file: File) => {
    if (!id) return;
    try {
      setUploading(true);
      await ragApi.uploadDoc(id, file);
      toast.success(`「${file.name}」上传成功，正在处理中...`);
      fetchKB(); // refresh to show new doc
    } catch (e: any) {
      toast.error(e.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const toggleChunks = async (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
      setExpandedDocs(newExpanded);
    } else {
      newExpanded.add(docId);
      setExpandedDocs(newExpanded);
      // Lazy load chunks
      if (!docChunks[docId]) {
        try {
          setLoadingChunks((s) => new Set(s).add(docId));
          const chunks = await ragApi.getChunks(docId);
          setDocChunks((prev) => ({ ...prev, [docId]: chunks }));
        } catch (e: any) {
          toast.error(e.message || '加载分块失败');
        } finally {
          setLoadingChunks((s) => { const ns = new Set(s); ns.delete(docId); return ns; });
        }
      }
    }
  };

  const handleSettingsUpdate = async (dto: CreateKBDto) => {
    if (!id) return;
    try {
      await ragApi.updateKB(id, dto);
      toast.success('设置已更新');
      setShowSettings(false);
      fetchKB();
    } catch (e: any) {
      toast.error(e.message || '更新失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!kb) return null;

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate('/rag')}
        className="mb-4 text-sm text-slate-500 transition hover:text-slate-700"
      >
        ← 返回知识库列表
      </button>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{kb.name}</h2>
          {kb.description && (
            <p className="mt-1 text-sm text-slate-500">{kb.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Settings2 className="h-4 w-4" />
          设置
        </button>
      </div>

      {/* Info Bar */}
      <div className="mb-6 flex flex-wrap gap-3">
        <InfoBadge label="检索模式" value={
          kb.retrievalMode === 'hybrid' ? '混合检索' :
          kb.retrievalMode === 'keyword' ? '关键词检索' : '向量检索'
        } />
        <InfoBadge label="TopK" value={String(kb.topK)} />
        <InfoBadge label="向量权重" value={String(kb.vectorWeight)} />
        <InfoBadge label="分块大小" value={String(kb.chunkSize)} />
        <InfoBadge label="Reranker" value={kb.rerankerEnabled ? kb.rerankerProvider : '关闭'} />
        <InfoBadge label="文档数" value={String(kb.documents?.length ?? 0)} />
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        className={`mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition ${
          dragover ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white'
        }`}
      >
        <Upload className={`mb-2 h-8 w-8 ${dragover ? 'text-blue-500' : 'text-slate-300'}`} />
        <p className="text-sm text-slate-500">
          {uploading ? '上传中...' : '拖拽文件到此处或点击上传'}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          支持 txt、md、pdf、docx、csv、json、html 格式
        </p>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
          <Upload className="h-4 w-4" />
          选择文件
          <input
            type="file"
            onChange={handleFileInput}
            accept=".txt,.md,.pdf,.docx,.csv,.json,.html"
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Document List */}
      <h3 className="mb-3 text-lg font-semibold text-slate-900">文档列表</h3>
      {(!kb.documents || kb.documents.length === 0) ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white py-10 text-center">
          <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">暂无文档，上传文件开始构建知识库</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 font-medium text-slate-600">文件名</th>
                <th className="px-4 py-3 font-medium text-slate-600">大小</th>
                <th className="px-4 py-3 font-medium text-slate-600">状态</th>
                <th className="px-4 py-3 font-medium text-slate-600">上传时间</th>
                <th className="px-4 py-3 font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {(kb.documents as Document[]).map((doc) => (
                <>
                  <tr
                    key={doc.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleChunks(doc.id)}
                        className="rounded p-0.5 text-slate-400 hover:text-slate-600"
                      >
                        {expandedDocs.has(doc.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{doc.name}</td>
                    <td className="px-4 py-3 text-slate-500">{formatSize(doc.size)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} error={doc.error} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(doc.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  {/* Chunk rows */}
                  {expandedDocs.has(doc.id) && (
                    <tr key={`${doc.id}-chunks`} className="bg-slate-50">
                      <td colSpan={6} className="px-4 py-3">
                        {loadingChunks.has(doc.id) ? (
                          <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            加载分块中...
                          </div>
                        ) : docChunks[doc.id]?.length === 0 ? (
                          <p className="py-4 text-center text-sm text-slate-400">
                            暂无分块（文档可能仍在处理中）
                          </p>
                        ) : (
                          <div className="max-h-64 space-y-2 overflow-y-auto">
                            {(docChunks[doc.id] || []).map((chunk) => (
                              <ChunkCard key={chunk.id} chunk={chunk} />
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <CreateKBModal
          initial={kb}
          onClose={() => setShowSettings(false)}
          onSubmit={handleSettingsUpdate}
        />
      )}
    </div>
  );
}

// ── Helpers ──

function InfoBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">
      <span className="text-slate-400">{label}: </span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function StatusBadge({ status, error }: { status: string; error?: string | null }) {
  const config: Record<string, { cls: string; text: string }> = {
    processing: { cls: 'bg-yellow-100 text-yellow-700', text: '处理中' },
    completed: { cls: 'bg-green-100 text-green-700', text: '就绪' },
    failed: { cls: 'bg-red-100 text-red-700', text: error || '失败' },
  };
  const c = config[status] || { cls: 'bg-slate-100 text-slate-600', text: status };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.cls}`}>
      {c.text}
    </span>
  );
}

function ChunkCard({ chunk }: { chunk: Chunk }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(chunk.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          分块 #{chunk.chunkIndex + 1} · 字符 {chunk.startIndex}–{chunk.endIndex}
        </span>
        <button
          onClick={handleCopy}
          className="rounded p-1 text-slate-400 transition hover:text-slate-600"
          title="复制内容"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600 line-clamp-6">
        {chunk.content}
      </p>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
