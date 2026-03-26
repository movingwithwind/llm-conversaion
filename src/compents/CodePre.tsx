import { useRef } from "react";
import { toast } from "sonner";
import { Copy } from 'lucide-react';
type Props = React.ComponentPropsWithoutRef<"pre">;

export default function COdePre({children,className,...rest}:Props){ 
   const preRef = useRef<HTMLPreElement>(null);

   function handleCopy() {
        if (typeof window === "undefined") return;
        const text = preRef.current?.textContent || "";
        navigator.clipboard.writeText(text).then(() => {
            toast.success("Code copied to clipboard!");
        });
    }
   return <div className="relative flex justify-center group ">
        <button onClick={handleCopy} className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 px-2 py-1 rounded text-sm cursor-pointer"><Copy className="w-4 h-4" /></button>
        <pre {...rest} className={`${className} overflow-x-auto w-full`} ref={preRef}>
            {children}
        </pre>
    </div>
}