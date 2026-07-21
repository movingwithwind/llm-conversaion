import { useEffect, useState } from 'react';
import { Database, ChevronDown } from 'lucide-react';
import { ragApi } from '../api/rag';
import type { KB } from '../api/rag-schema';

interface Props {
  selectedKBId: string;
  onChange: (kbId: string) => void;
  className?: string;
}

export default function KBSelector({ selectedKBId, onChange, className = '' }: Props) {
  const [kbs, setKbs] = useState<KB[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    ragApi.listKBs().then(setKbs).catch(() => setKbs([]));
  }, []);

  const selected = kbs.find((k) => k.id === selectedKBId);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-slate-400"
      >
        <Database className="h-3.5 w-3.5" />
        {selected ? (
          <span className="max-w-[120px] truncate">{selected.name}</span>
        ) : (
          <span className="text-slate-400">无知识库</span>
        )}
        <ChevronDown className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-20 mb-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-xs transition hover:bg-slate-50 ${
                !selectedKBId ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
              }`}
            >
              📭 不使用知识库
            </button>
            {kbs.map((kb) => (
              <button
                key={kb.id}
                onClick={() => { onChange(kb.id); setOpen(false); }}
                className={`w-full truncate px-3 py-2 text-left text-xs transition hover:bg-slate-50 ${
                  selectedKBId === kb.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
                }`}
              >
                <span className="font-medium">{kb.name}</span>
                <span className="ml-2 text-slate-400">
                  ({kb.retrievalMode === 'hybrid' ? '混合' : kb.retrievalMode === 'keyword' ? '关键词' : '向量'})
                </span>
              </button>
            ))}
            {kbs.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">暂无知识库</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
