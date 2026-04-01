import Input from "./input";
import MessageQueue from "./Message-quene";
import {  useState,useEffect,useRef } from "react";
import {toast} from"sonner";
import { FileChartColumnIncreasing } from 'lucide-react';
import { useFileDrop } from "./useFileDrop";
import { SUPPORTED_MIME_TYPES } from "../../compents/FileType";
import {  Loader } from 'lucide-react';
import { createParser } from 'eventsource-parser';

type EvocationProps = {
    className?: string;
    onClose: () => void;
}
type Message = {
    id: number;
    cliendId: string;
    role: 'user' | 'assistant';
    content: string;
};

type backMessage = {
    id: number;
    role: 'user' | 'assistant';
    content: string;
};

type DoneData = {
    client_user_id: string;
    client_assistant_id: string;
    userid: number;
    assistantid: number;
}

function isDoneData(value: unknown): value is DoneData {
    if (!value || typeof value !== 'object') return false;
    const data = value as Record<string, unknown>;
    return (
        typeof data.client_user_id === 'string' &&
        typeof data.client_assistant_id === 'string' &&
        typeof data.userid === 'number' &&
        typeof data.assistantid === 'number'
    );
}


export default function Evocation({className, onClose}: EvocationProps) {
    const {isDragging,bind,handleDrop}=useFileDrop();

    const [question, setQuestion] = useState('');
    const [Loading, setLoading]=useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [isAnswering, setIsAnswering] = useState(false);
    const [Messages, setMessages] = useState<Message[]>([])
    const formData = new FormData();
    const fileInput = useRef<HTMLInputElement>(null);

    function updateAssistantMessageById(assistantId: number, content: string) {
        setMessages(prev => prev.map(message => {
            if (message.id === assistantId && message.role === 'assistant') {
                return { ...message, content };
            }
            return message;
        }));
    }

    async function readSseAnswerStream(response: Response, assistantId: number) {
        if (!response.body) throw new Error('Response body is empty');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessageText = '';
        let done = false;
        
        let rafId: number | null = null;

        const parser = createParser({
            onEvent(event){
                const eventType = (event.event ?? '').trim();//去除空格避免影响判断
                const payload = (event.data ?? '').trim();
                let parsedData: unknown = null;

                if (payload.startsWith('{')) {
                    try {
                        parsedData = JSON.parse(payload);
                    } catch {
                        parsedData = null;
                    }
                }


                if(eventType === 'done' || payload === '[DONE]' || isDoneData(parsedData)){
                    if(isDoneData(parsedData)) {
                        const data = parsedData;
                        setMessages(prev =>
                            prev.map((msg) => {
                                if (msg.role === 'user' && msg.cliendId === data.client_user_id) {
                                    return { ...msg, id: data.userid };
                                }
                                if (msg.role === 'assistant' && msg.cliendId === data.client_assistant_id) {
                                    return { ...msg, id: data.assistantid };
                                }
                                return msg;
                            })
                        );
                    }
                    done = true;
                    return;
                }
                if(eventType !== 'answer') return;
                try{
                    const data = (parsedData ?? JSON.parse(payload)) as { answer?: string };
                    if(typeof data.answer !== 'string' || !data.answer) return;
                    assistantMessageText += data.answer;
                    if(!rafId){
                        rafId = requestAnimationFrame(() => {
                            updateAssistantMessageById(assistantId, assistantMessageText);
                            rafId = null; // 执行完后清理 ID，允许下一帧调度
                        });                        
                    }
                }catch{
                    throw new Error('Failed to parse SSE data');
                }
        }});
        while(!done) {
            const { value, done } = await reader.read();
            if(done) break;
            if(!value) continue;
            parser.feed(decoder.decode(value, { stream: true }));
            console.log('Received chunk:', decoder.decode(value, { stream: true }));
        }
        parser.feed(decoder.decode());

        //清理遗留的 raf 调度，确保最终结果被正确更新
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
        }
        updateAssistantMessageById(assistantId, assistantMessageText);
    }
     function handleFileupload(e: React.ChangeEvent<HTMLInputElement>){
        const file = e.target.files?.[0];
        if(file&&SUPPORTED_MIME_TYPES.includes(file.type)) {setFile(file); console.log(file.type)}
        else toast.error("Please upload a file with a supported MIME type.");
    }

    const handleFileDrop=(e: React.DragEvent<HTMLDivElement>) => {
        handleDrop(e);

        const droppedFile = e.dataTransfer?.files?.[0];

        if (droppedFile && SUPPORTED_MIME_TYPES.includes(droppedFile.type)) {
            setFile(droppedFile);
            console.log('drop file:', droppedFile.type);
        } else {
            toast.error("Unsupported file type");
        }
    }

    async function fetchPostAnswer(question: string) {
        if (!question.trim()) return;

        setQuestion('');
        setFile(null);
        setIsAnswering(true);
        const userId = Messages.length + 1;
        const userCliendId = `user-${Date.now()}-${userId}`;
        const assistantId = Messages.length + 2;
        const assistantCliendId = `assistant-${Date.now()}-${assistantId}`;
        setMessages(prev => [
            ...prev,
            { id: userId, role: 'user', content: question, cliendId: userCliendId },
            { id: assistantId, role: 'assistant', content: '', cliendId: assistantCliendId },
        ]);

        try {
            formData.append('message', question);
            formData.append('id','1');
            formData.append('client_user_id', userCliendId);
            formData.append('client_assistant_id', assistantCliendId);
            if(file) formData.append('file',file);
            console.log(formData)
            const response = await fetch('/api/chat', {
                method: 'POST',
                body:formData,
            });
            if (!response.ok) throw new Error('Network response was not ok');
            await readSseAnswerStream(response, assistantId);
        }catch (error) {
            toast.error(`Failed to fetch answer: ${(error as Error).message}`);
        } 
        finally {
            setIsAnswering(false);
        }
    }

    async function fetchPutAnswer(node_id=1,message_id:number,role:"user"|"assistant",message?:string) {
        setIsAnswering(true);
         setMessages(
        Messages.map((msg) => {
            if (msg.id === message_id) {
            return { ...msg, content: '' }; 
            }
            return msg; 
        })
        );
        const body={node_id,message_id,role}
        try{
            const response = await fetch('/api/chat', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            await readSseAnswerStream(response, message_id);
        }catch (error) {
            toast.error(`Failed to fetch answer: ${(error as Error).message}`);
        }finally {
            setIsAnswering(false);
        }
    }
    async function fetchmessages(id:string){
        const response = await fetch(`/api/chat?id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        const data = await response.json() ;
        if(!response.ok) throw new Error(`Network response was not ok,${data.message}`);
        setMessages(data.map((item:backMessage) =>({...item,cliendId:`${item.role}-${Date.now()}-${item.id}` })));
        setLoading(false);
    }
    useEffect(()=>{
        try{
        fetchmessages("1");
        }catch(error){
            toast.error(`Failed to fetch messages: ${(error as Error).message}`);
        }
    },[])
    return (
        <div className={`${className} relative overflow-hidden ${Loading ? 'animate-pulse' : ''}`} {...bind} onDrop={handleFileDrop}>
            {/*文件拖拽部分  */}
            {isDragging && (
            <div className="absolute inset-0 z-50 bg-black/10 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="text-white text-center px-6 py-4  bg-white/10 ">
                <p className="text-lg font-medium mb-2">拖拽文件到这里</p>
                <p className="text-sm opacity-80">
                    支持的文件类型：{SUPPORTED_MIME_TYPES.join(', ')}
                </p>
                </div>
            </div>
            )}

            {/*消息预加载部分*/}
            {Loading ? <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 "><div className="animate-spin-custom"><Loader className="w-8 h-8" /></div></div>:<MessageQueue Messages={Messages} retry={fetchPutAnswer} setMessages={setMessages}/>}

            {/* 关闭按钮 */}
            <button onClick={onClose} className="absolute top-4 right-4">X</button>

            {/*消息预加载处理*/}
            {Loading?'':<div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[650px] flex flex-col overflow-hidden rounded-3xl border border-gray-300 bg-white">
            
                {/* 文件列表 */}
                {file&&<div className="mb-2 group pl-2 pt-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur border border-gray-200 rounded  text-gray-700 hover:bg-black/10 w-[200px] h-[60px]">
                                <div className="bg-blue-500 text-white rounded-sm w-8 h-8 flex items-center justify-center flex-shrink-0"><FileChartColumnIncreasing className="w-4 h-4" /> </div>
                                <span className="max-w-[160px] truncate">{file.name}</span>
                                <button
                                onClick={() => setFile(null)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 self-start text-xs">X</button>
                            </div>
                        </div>}

                {/* 实际输入框 */}
                <Input   question={question} setQuestion={setQuestion} onSubmit={fetchPostAnswer} isAnswering={isAnswering} fileInput={()=>fileInput?.current?.click()}/>
            
            </div>}

            {/* 隐藏文件上传input */}
            <input type="file" className="hidden" onChange={handleFileupload} ref={fileInput} />
        </div>)
}