import KBSelector from '../../components/KBSelector';

type PromptComposerProps = {
  question: string
  onQuestionChange: (value: string) => void
  onSend: () => void
  selectedKBId: string
  onKBChange: (kbId: string) => void
}

function PromptComposer({ question, onQuestionChange, onSend, selectedKBId, onKBChange }: PromptComposerProps) {
  return (
    <section className="border-t border-slate-200 bg-slate-100/80 p-3 md:p-4">

      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">参考知识库:</span>
        <KBSelector selectedKBId={selectedKBId} onChange={onKBChange} />
      </div>

      <form className="mt-3 flex flex-col gap-3 md:flex-row" onSubmit={(e) => {
        e.preventDefault()
        onSend()
      }}>
        <input
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="......"
          className="h-12 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-slate-700 outline-none ring-blue-200 placeholder:text-slate-400 focus:ring"
        />
        <button
          className="h-12 rounded-lg bg-[linear-gradient(180deg,#3e8eff_0%,#2b6de6_100%)] px-7 text-base font-semibold text-white shadow hover:brightness-105 cursor-pointer"
        >
          Submit
        </button>
      </form>
    </section>
  )
}

export default PromptComposer
