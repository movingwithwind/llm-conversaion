export default function Input({className}: {className?: string}) {
    return <>
        <input type="text" className={`h-12 flex-1 rounded-lg  o bg-white px-4 text-slate-700 outline-none ring-blue-200 placeholder:text-slate-400  ${className || ''}`} placeholder="......" />
    </>
}