import Input from "./input";
import MessageQueue from "./Message-quene";
import {  useState,useEffect,useRef } from "react";
import {toast} from"sonner"
import { useFileDrop } from "./useFileDrop";
import { SUPPORTED_MIME_TYPES } from "../../compents/FileType";
import {  Loader } from 'lucide-react';
import { createParser } from 'eventsource-parser';

type EvocationProps = {
    className?: string;
    onClose: () => void;
}
type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};


export default function Evocation({className, onClose}: EvocationProps) {
    const {isDragging,bind,handleDrop}=useFileDrop();

    const [question, setQuestion] = useState('');
    const [Loading, setLoading]=useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [isAnswering, setIsAnswering] = useState(false);
    const [Messages, setMessages] = useState<Message[]>([])
    const formData = new FormData();
    const fileInput = useRef<HTMLInputElement>(null);

    function updateAssistantMessageById(assistantId: string, content: string) {
        setMessages(prev => prev.map(message => {
            if (message.id === assistantId && message.role === 'assistant') {
                return { ...message, content };
            }
            return message;
        }));
    }

    async function readSseAnswerStream(response: Response, assistantId: string) {
        if (!response.body) throw new Error('Response body is empty');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessageText = '';
        let done = false;
        
        let rafId: number | null = null;

        const parser = createParser({
            onEvent(event){
                if(event.event === 'done'||event.data === '[DONE]'){ 
                    done = true;
                    return;
                }
                if(event.event !== 'answer') return;
                try{
                    const data = JSON.parse(event.data);
                    if(!data.answer) return;
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

    function handlecancelFile(){
        setFile(null);
    }
    async function fetchAnswer(question: string) {
        if (!question.trim()) return;

        setQuestion('');
        setIsAnswering(true);
        const assistantId = (Messages.length + 2).toString();
        setMessages(prev => [
            ...prev,
            { id: (Messages.length + 1).toString(), role: 'user', content: question },
            { id: assistantId, role: 'assistant', content: '' },
        ]);

        try {
            formData.append('message', question);
            formData.append('id','1');
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
    async function fetchmessages(id:string){
        const response = await fetch(`/api/chat?id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        const data = await response.json();
        if(!response.ok) throw new Error(`Network response was not ok,${data.message}`);
        setMessages(data);
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
            {Loading ? <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 "><div className="animate-spin-custom"><Loader className="w-8 h-8" /></div></div>:<MessageQueue Messages={Messages} />}

            {/* 关闭按钮 */}
            <button onClick={onClose} className="absolute top-4 right-4">X</button>

            {/*消息预加载处理*/}
            {Loading?'':<div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[650px] flex flex-col overflow-hidden rounded-3xl border border-gray-300 bg-white">
            
                {/* 文件列表 */}
                {file&&<div className="mb-2 group pl-2 pt-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur border border-gray-200 rounded-xl  text-gray-700 hover:bg-black/10 w-[200px] h-[60px]">
                                <span className="max-w-[160px] truncate">{file.name}</span>
                                <button
                                onClick={() => setFile(null)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 self-start text-xs">X</button>
                            </div>
                        </div>}

                {/* 实际输入框 */}
                <Input   question={question} setQuestion={setQuestion} onSubmit={fetchAnswer} isAnswering={isAnswering} fileInput={()=>fileInput?.current?.click()}/>
            
            </div>}

            {/* 隐藏文件上传input */}
            <input type="file" className="hidden" onChange={handleFileupload} ref={fileInput} />
        </div>)
}