import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, Database, Loader2 } from 'lucide-react';
import { ragApi } from '../../api/rag';
import type { KB, CreateKBDto } from '../../api/rag-schema';
import CreateKBModal from './CreateKBModal';

export default function KBList() {
  const [kbs, setKbs] = useState<KB[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingKB, setEditingKB] = useState<KB | null>(null);
  const navigate = useNavigate();

  const fetchKBs = async () => {
    try {
      setLoading(true);
      const data = await ragApi.listKBs();
      setKbs(data);
    } catch (e: any) {
      toast.error(e.message || '加载知识库列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKBs();
  }, []);

  const handleCreate = async (dto: CreateKBDto) => {
    try {
      await ragApi.createKB(dto);
      toast.success('知识库创建成功');
      setShowCreate(false);
      fetchKBs();
    } catch (e: any) {
      toast.error(e.message || '创建失败');
    }
  };

  const handleUpdate = async (id: string, dto: CreateKBDto) => {
    try {
      await ragApi.updateKB(id, dto);
      toast.success('知识库更新成功');
      setEditingKB(null);
      fetchKBs();
    } catch (e: any) {
      toast.error(e.message || '更新失败');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确认删除知识库「${name}」？该操作不可恢复。`)) return;
    try {
      await ragApi.deleteKB(id);
      toast.success('知识库已删除');
      fetchKBs();
    } catch (e: any) {
      toast.error(e.message || '删除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">知识库列表</h2>
          <p className="mt-1 text-sm text-slate-500">管理您所有的知识库及其文档</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新建知识库
        </button>
      </div>

      {/* Empty state */}
      {kbs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white py-16">
          <Database className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">暂无知识库</p>
          <p className="mt-1 text-xs text-slate-400">点击「新建知识库」开始创建</p>
        </div>
      ) : (
        /* Table */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">名称</th>
                <th className="px-4 py-3 font-medium text-slate-600">文档数</th>
                <th className="px-4 py-3 font-medium text-slate-600">检索模式</th>
                <th className="px-4 py-3 font-medium text-slate-600">Reranker</th>
                <th className="px-4 py-3 font-medium text-slate-600">创建时间</th>
                <th className="px-4 py-3 font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {kbs.map((kb) => (
                <tr
                  key={kb.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{kb.name}</div>
                    {kb.description && (
                      <div className="mt-0.5 text-xs text-slate-400">{kb.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {kb._count?.documents ?? kb.documents?.length ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      kb.retrievalMode === 'hybrid' ? 'bg-green-100 text-green-700' :
                      kb.retrievalMode === 'keyword' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {kb.retrievalMode === 'hybrid' ? '混合' :
                       kb.retrievalMode === 'keyword' ? '关键词' : '向量'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {kb.rerankerEnabled ? (
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {kb.rerankerProvider}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">关闭</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(kb.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/rag/knowledge-bases/${kb.id}`)}
                        className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                        title="查看详情"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingKB(kb)}
                        className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        title="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(kb.id, kb.name)}
                        className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateKBModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Edit Modal */}
      {editingKB && (
        <CreateKBModal
          initial={editingKB}
          onClose={() => setEditingKB(null)}
          onSubmit={(dto) => handleUpdate(editingKB.id, dto)}
        />
      )}
    </div>
  );
}
