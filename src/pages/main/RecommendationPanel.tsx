import { recommendationItems } from './data'

function RecommendationPanel() {
  return (
    <aside className="w-full shrink-0 bg-slate-100/70 p-3 lg:w-72 lg:p-4">
      <div className="rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700">推理路径</h3>
        <ol className="mt-3 space-y-2 text-slate-700">
          {recommendationItems.map((item, index) => (
            <li key={item} className="rounded-md px-2 py-1.5 text-sm hover:bg-slate-100">
              <span className="mr-2 font-semibold text-slate-500">{index + 1}.</span>
              {item}
            </li>
          ))}
        </ol>
        <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">展开更多...</button>
      </div>

      <div className="mt-4 space-y-3">
        <button className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm hover:bg-slate-50">
          + 添加节点
        </button>
        <button className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm hover:bg-slate-50">
          深入分析
        </button>
      </div>
    </aside>
  )
}

export default RecommendationPanel
