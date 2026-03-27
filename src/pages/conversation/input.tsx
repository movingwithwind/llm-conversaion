import { MoveUp, Square  } from 'lucide-react';
export default function Input({className, question, setQuestion, onSubmit, isAnswering}: {className?: string; question: string; setQuestion: (q: string) => void; onSubmit: (q: string) => void; isAnswering: boolean}) {
    return <>
        <form onSubmit={(e) => {e.preventDefault(); onSubmit(question); }} className ={ `relative w-full max-w-[650px] ${className}` }>
        <input 
            type="text" 
            className={`h-12 pr-12  bg-white px-4 text-slate-700 outline-none ring-blue-200 placeholder:text-slate-400 border border-gray-300 rounded-3xl w-full`} 
            placeholder="......" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isAnswering}
        />
            <button type="submit" disabled={isAnswering} className={` absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full ${!isAnswering ? 'bg-black' : 'bg-black/10'} }`}>
                {!isAnswering ? <MoveUp className="h-5 w-5 text-white" /> : <Square className='h-4 w-4 text-black ' fill="currentColor" stroke="none"/>}
            </button>
        </form>
    </>
}