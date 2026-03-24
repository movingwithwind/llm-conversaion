
type QuestionSidebarProps = {
  question: string

}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
}

function QuestionSidebar({ question }: QuestionSidebarProps) {
  return (
    <aside className="w-full shrink-0 bg-slate-200/80 p-3 lg:w-64 lg:p-4">
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-300/70 bg-white/70 p-3">
          <SectionTitle title="Current Question" />
          <input
            value={question}
            disabled
            placeholder="..."
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 select-none outline-none ring-blue-200 placeholder:text-slate-400 focus:ring"
          />
        </div>


      </div>
    </aside>
  )
}

export default QuestionSidebar
