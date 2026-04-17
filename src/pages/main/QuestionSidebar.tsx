import {type Map} from "./data"
import { Clock, Trash2 } from 'lucide-react'



function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
}

function QuestionSidebar({ question, Maps,getgraph,avtivemapId }: { question: string; Maps: Map[]; getgraph: (id:number) => void; avtivemapId: number | null }) {
  const safeMaps = Array.isArray(Maps) ? Maps : []

  return (
    <aside className="w-full shrink-0 bg-slate-200/80 p-3 lg:w-64 lg:p-4  overflow-y-auto">
      <div className="space-y-3 flex flex-col gap-4">
        <div className="rounded-lg border border-slate-300/70 bg-white/70 p-3">
          <SectionTitle title="Current Question" />
          <input
            value={question}
            disabled
            placeholder="..."
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 select-none outline-none ring-blue-200 placeholder:text-slate-400 focus:ring"
          />
        </div>

        <div className="rounded-lg border border-slate-300/70 bg-white/70 p-3">
          <div className="flex items-center justify-between mb-3">
            <SectionTitle title="History Questions" />
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {safeMaps.map((item) => (
              <div
                key={item.id}
                onClick={() => getgraph(item.id)}
                className={`group p-2 rounded-md bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all ${avtivemapId === item.id ? '!bg-blue-100 !border-blue-300' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 line-clamp-2 group-hover:text-blue-700">
                      {item.question}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">2h ago</p>
                  </div>
                  <button 
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default QuestionSidebar
