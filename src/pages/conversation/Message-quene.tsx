import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { StickToBottom } from 'use-stick-to-bottom';
import CodePre from '../../compents/CodePre';
import { Copy,RefreshCw, PencilLine,Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRef,useState } from 'react';

type Message = {
    id: number;
    cliendId: string;
    parent_id: number | null;
    role: 'user' | 'assistant';
    content: string;
  nodeLabels?: string[];
  isThinking?: boolean;
  thinkingData?: string;
};

export default function MessageQueue({ Messages,retry,setMessages}: { Messages: Message[],retry:(node_id:number,message_id:number,role:"user"|"assistant",message?:string)=>void,setMessages:React.Dispatch<React.SetStateAction<Message[]>> }) {
  const messageRefs = useRef<HTMLDivElement[]>([]); 
  const [isEditing,setisEditing]=useState(new Array(Messages.length).fill(false));
  const [isCopying,setisCopying]=useState(new Array(Messages.length).fill(false));

  function handleCopy(id:number,index:number) {
      setisCopying(prev => { const newCopying = [...prev]; newCopying[index] = true; return newCopying; });
      setTimeout(() => {setisCopying(prev => { const newCopying = [...prev]; newCopying[index] = false; return newCopying; });}, 1000);
      if (typeof window === "undefined") return;
      const text = messageRefs.current[id].textContent || "";
      navigator.clipboard.writeText(text).catch(() => {toast.error("复制失败")});
  }

  const handleEdit=(e:React.ChangeEvent<HTMLTextAreaElement>,message:Message) =>
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === message.id
                            ? { ...msg, content: e.target.value }
                            : msg
                        )
                      )


  const handleSubmitEdit=(message:Message,index:number) => {
    setisEditing(prev => { const newEditing = [...prev]; newEditing[index] = !newEditing[index]; return newEditing; }); 
    if(isEditing[index]) retry(1,message.id,message.role,message.content);
    }

  return (
    <>
        <StickToBottom className='h-full overflow-y-auto' initial='smooth' resize='smooth'>
      <StickToBottom.Content className='flex flex-col gap-2 mb-16 p-6'>
        {Messages.map((message, index) => (
          <div
            key={message.cliendId}
            className={'p-4 rounded-lg mb-2 max-w-[85%] ' + (message.role === 'user' ? 'group bg-blue-300 self-end' : ' self-start')}
            ref={(el) => (el && (messageRefs.current[message.id] = el), undefined)}>

            {message.role === 'assistant' ? message.isThinking ? Thinkingstatus(message.thinkingData ?? '思考中') : (
              <div className='prose prose-sm max-w-none' id={`message-${message.cliendId}`}>
                {message.nodeLabels && message.nodeLabels.length > 0 && (
                  <div className='mb-2 flex flex-wrap gap-1 not-prose'>
                    {message.nodeLabels.map((label) => (
                      <span key={`${message.id}-${label}`} className='rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700'>
                        {label}
                      </span>
                    ))}
                  </div>
                )}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
                  components={{ pre: CodePre }}
                >
                    {message.content}
                </ReactMarkdown>
                <div className='w-full flex  h-6 pl-4 gap-2'>
                  <button className='hover:bg-gray-200 h-6 w-6 flex justify-center items-center rounded-sm' onClick={() => handleCopy(message.id,index)}>{isCopying[index] ? <Check className='h-4 w-4'/> : <Copy className='h-4 w-4'/>}</button>
                  <button className='hover:bg-gray-200 h-6 w-6 flex justify-center items-center rounded-sm' onClick={()=>{retry(1,message.id,"assistant")}}><RefreshCw className='h-4 w-4'/></button>
                </div>
              </div>
            ) : (
              <div className=' relative' id={`message-${message.cliendId}`}>
                  {isEditing[index]?
                  <textarea value={message.content} onChange={(e)=>handleEdit(e,message)} className='resize-none field-sizing-content h-[100px] w-[300px] w-full  p-2 outline-none'/>:<div>{message.content}</div>}
                <div className='opacity-0 group-hover:opacity-100  absolute right-0 -bottom-11 flex gap-1 text-gray-500 transition-opacity duration-200'>
                  <button className='hover:bg-blue-300 h-6 w-6 flex justify-center items-center rounded-sm' onClick={() => handleCopy(message.id,index)}>{isCopying[index] ? <Check className='h-4 w-4'/> : <Copy className='h-4 w-4'/>}</button>
                  <button
                    className='hover:bg-blue-300 h-6 w-6 flex justify-center items-center rounded-sm'
                    onClick={() => handleSubmitEdit(message,index)}>
                    {isEditing[index] ? <Check className='h-4 w-4'/> : <PencilLine className='h-4 w-4'/>}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </StickToBottom.Content>
    </StickToBottom>
    </>

  );
}

function Thinkingstatus(ThinkingData: string) {
  return (
    <div className='text-sm text-gray-500 flex items-center gap-2'>
      <span className='thinking-dot' />
      <p>{ThinkingData}</p>
    </div>
  )
}