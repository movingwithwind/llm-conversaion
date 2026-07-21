import { Outlet, Link } from 'react-router-dom';
import { Database, ArrowLeft } from 'lucide-react';

export default function RagLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            to="/main"
            className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            返回主界面
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2 text-slate-800">
            <Database className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-semibold">知识库管理</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
