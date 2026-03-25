export default function Input({className, question, setQuestion, onSubmit}: {className?: string; question: string; setQuestion: (q: string) => void; onSubmit: (q: string) => void}) {
    return <>
        <form onSubmit={(e) => {e.preventDefault(); onSubmit(question);}}>
        <input 
            type="text" 
            className={`h-12 flex-1 rounded-lg  o bg-white px-4 text-slate-700 outline-none ring-blue-200 placeholder:text-slate-400  ${className || ''}`} 
            placeholder="......" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
        /></form>
    </>
}