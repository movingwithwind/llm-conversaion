import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { StickToBottom } from 'use-stick-to-bottom';
import CodePre from '../../compents/CodePre';
import { Copy,RefreshCw, PencilLine,Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRef,useState } from 'react';

type Message= {
  id: number;
  cliendId: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function MessageQueue({ Messages,retry,setMessages}: { Messages: Message[],retry:(node_id:number,message_id:number,role:"user"|"assistant",message?:string)=>void,setMessages:React.Dispatch<React.SetStateAction<Message[]>>}) {
  const messageRefs = useRef<HTMLDivElement[]>([]); 
  const [isEditing,setisEditing]=useState(false);

  function handleCopy(id:number) {
      if (typeof window === "undefined") return;
      const text = messageRefs.current[id].textContent || "";
      navigator.clipboard.writeText(text).then(() => {
          toast.success("Code copied to clipboard!");
      });
  }

  const handleEdit=(e:React.ChangeEvent<HTMLInputElement>,message:Message) =>
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === message.id
                            ? { ...msg, content: e.target.value }
                            : msg
                        )
                      )

  return (
    <>
        <StickToBottom className='h-full overflow-y-auto' initial='smooth' resize='smooth'>
      <StickToBottom.Content className='flex flex-col gap-2 mb-16 p-6'>
        {Messages.map((message) => (
          <div
            key={message.cliendId}
            className={'p-4 rounded-lg mb-2 max-w-[85%] ' + (message.role === 'user' ? 'group bg-black/10 self-end' : ' self-start')}
            ref={(el) => (el && (messageRefs.current[message.id] = el), undefined)}>

            {message.role === 'assistant' ? (
              <div className='prose prose-sm max-w-none' id={`message-${message.cliendId}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
                  components={{ pre: CodePre }}
                >
                    {message.content}
                </ReactMarkdown>
                <div className='w-full flex  h-6 pl-4 gap-2'>
                  <button className='hover:bg-gray-200 h-6 w-6 flex justify-center items-center rounded-sm' onClick={() => handleCopy(message.id)}><Copy className='h-4 w-4'/></button>
                  <button className='hover:bg-gray-200 h-6 w-6 flex justify-center items-center rounded-sm' onClick={()=>{retry(1,message.id,"assistant")}}><RefreshCw className='h-4 w-4'/></button>
                </div>
              </div>
            ) : (
              <div className=' relative' id={`message-${message.cliendId}`}>
                  {isEditing?
                  <input value={message.content} onChange={(e)=>handleEdit(e,message)} />:<div>{message.content}</div>}
                <div className='opacity-0 group-hover:opacity-100  absolute right-0 -bottom-11 flex gap-1 text-gray-500 transition-opacity duration-200'>
                  <button className='hover:bg-black/10 h-6 w-6 flex justify-center items-center rounded-sm' onClick={()=>handleCopy(message.id)}><Copy className='h-4 w-4'/></button>
                  <button className='hover:bg-black/10 h-6 w-6 flex justify-center items-center rounded-sm' onClick={()=>setisEditing(true)}><PencilLine className='h-4 w-4'/></button>
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