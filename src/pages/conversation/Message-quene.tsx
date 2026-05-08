import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
import CodePre from '../../compents/CodePre';
import { Copy,RefreshCw, PencilLine,Check } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import {type Message } from './usechatlogic';

export default function MessageQueue({ Messages,retry,setMessages}: { Messages: Message[],retry:(node_id:number,message_id:number,role:"user"|"assistant",message?:string)=>void,setMessages:React.Dispatch<React.SetStateAction<Message[]>> }) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [isEditing,setisEditing]=useState<boolean[]>([]);
  const [isCopying,setisCopying]=useState<boolean[]>([]);

  useEffect(() => {
    if (Messages.length > 0) {
      const timer = setTimeout(() => {
        virtuosoRef.current?.scrollTo({
          top: 999999,
          // 流式生成时更新非常频繁，不建议开启 smooth，否则动画会被互相打断导致卡顿或停滞
          behavior: 'auto'
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [Messages]);

  function handleCopy(content:string,index:number) {
      setisCopying(prev => { const newCopying = [...prev]; newCopying[index] = true; return newCopying; });
      setTimeout(() => {setisCopying(prev => { const newCopying = [...prev]; newCopying[index] = false; return newCopying; });}, 1000);
      if (typeof window === "undefined") return;
      navigator.clipboard.writeText(content).catch(() => {toast.error("复制失败")});
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

  const renderMessage = (index: number, message: Message) => {
    return (
          <div
            key={message.cliendId}
            className={'p-4 rounded-lg mb-2 max-w-[85%] ' + (message.role === 'user' ? 'group bg-blue-300 ml-auto' : 'mr-auto')}
            style={{ width: 'fit-content' }}>

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
                  <button className='hover:bg-gray-200 h-6 w-6 flex justify-center items-center rounded-sm' onClick={() => handleCopy(message.content,index)}>{isCopying[index] ? <Check className='h-4 w-4'/> : <Copy className='h-4 w-4'/>}</button>
                  <button className='hover:bg-gray-200 h-6 w-6 flex justify-center items-center rounded-sm' onClick={()=>{retry(1,message.id,"assistant")}}><RefreshCw className='h-4 w-4'/></button>
                </div>
              </div>
            ) : (
              <div className=' relative' id={`message-${message.cliendId}`}>
                  {isEditing[index]?
                  <textarea value={message.content} onChange={(e)=>handleEdit(e,message)} className='resize-none field-sizing-content h-[100px] w-[300px] w-full  p-2 outline-none text-black'/>:<div>{message.content}</div>}
                <div className='opacity-0 group-hover:opacity-100  absolute right-0 -bottom-11 flex gap-1 text-gray-500 transition-opacity duration-200 z-10'>
                  <button className='hover:bg-blue-300 h-6 w-6 flex justify-center items-center rounded-sm' onClick={() => handleCopy(message.content,index)}>{isCopying[index] ? <Check className='h-4 w-4'/> : <Copy className='h-4 w-4'/>}</button>
                  <button
                    className='hover:bg-blue-300 h-6 w-6 flex justify-center items-center rounded-sm'
                    onClick={() => handleSubmitEdit(message,index)}>
                    {isEditing[index] ? <Check className='h-4 w-4'/> : <PencilLine className='h-4 w-4'/>}
                  </button>
                </div>
              </div>
            )}
          </div>
    );
  };

  return (
    <div className="h-full w-full">
      <Virtuoso
        ref={virtuosoRef}
        className="h-full w-full"
        data={Messages}
        itemContent={renderMessage}
        followOutput="smooth"
        initialTopMostItemIndex={Messages.length > 0 ? Messages.length - 1 : 0}
        components={{ Footer: () => <div className="h-18" /> }}
      />
    </div>
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