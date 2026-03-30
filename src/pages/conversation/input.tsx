import { MoveUp, Square, Plus } from 'lucide-react';
export default function Input({className, question, setQuestion, onSubmit, isAnswering,fileInput}: {className?: string; question: string; setQuestion: (q: string) => void; onSubmit: (q: string) => void; isAnswering: boolean,fileInput:()=>void}) {
    return <>
        <form onSubmit={(e) => {e.preventDefault(); onSubmit(question); }} className ={ `w-full relative ${className}` }>
        <input 
            type="text" 
            className={`h-12 w-full rounded-none border-0 bg-transport px-4 pl-12 pr-12 text-slate-700 outline-none ring-blue-200 placeholder:text-slate-400`} 
            placeholder="......" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isAnswering}
        />
            <button type="submit" disabled={isAnswering} className={` absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full ${!isAnswering ? 'bg-black' : 'bg-black/10'} }`}>
                {!isAnswering ? <MoveUp className="h-5 w-5 text-white" /> : <Square className='h-4 w-4 text-black ' fill="currentColor" stroke="none"/>}
            </button>
            <button className=' absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full' onClick={fileInput}><Plus className="h-5 w-5 text-black" /> </button>
        </form>
    </>
}