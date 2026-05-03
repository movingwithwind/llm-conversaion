import Input from "./input";
import MessageQueue from "./Message-quene";
import {  useState,useEffect,useRef, useCallback } from "react";
import {toast} from"sonner";
import { FileChartColumnIncreasing } from 'lucide-react';
import { useFileDrop } from "./useFileDrop";
import { SUPPORTED_MIME_TYPES } from "../../compents/FileType";
import {  Loader } from 'lucide-react';
import type { nodeschemaType } from "../../api/schema";
import { createParser } from 'eventsource-parser';
import { chatAPi } from "../../api/chat";

type EvocationProps = {
    className?: string;
    onClose: () => void;
    selectedNodes: nodeschemaType;
}
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

type backMessage = {
    id: number;
    parent_id: number | null;
    role: 'user' | 'assistant';
    content: string;
    node_links?: Array<{
        node?: {
            data?: {
                label?: string;
            };
        };
    }>;
};

type DoneData = {
    client_user_id: string;
    client_assistant_id: string;
    userid: number;
    assistantid: number;
    user_parent_id: number | null;
    assistant_parent_id: number | null;
}

type RegenerateBody = {
  node_id: number;
  message_id: number;
  role: 'user' | 'assistant';
  message?: string; // 仅 user 编辑时用
};

function isDoneData(value: unknown): value is DoneData {
    if (!value || typeof value !== 'object') return false;
    const data = value as Record<string, unknown>;
    return (
        typeof data.client_user_id === 'string' &&
        typeof data.client_assistant_id === 'string' &&
        typeof data.userid === 'number' &&
        typeof data.assistantid === 'number' &&
        (typeof data.user_parent_id === 'number' || data.user_parent_id === null) &&
        (typeof data.assistant_parent_id === 'number' || data.assistant_parent_id === null)
    );
}


export default function Evocation({className, onClose, selectedNodes}: EvocationProps) {
    const {isDragging,bind,handleDrop}=useFileDrop();

    const [question, setQuestion] = useState('');
    const [includeBackgroundInfo, setIncludeBackgroundInfo] = useState(true);
    const [Loading, setLoading]=useState(true);
    const [files, setFiles] = useState<File[] | null>(null);
    const [isAnswering, setIsAnswering] = useState(false);
    const [Messages, setMessages] = useState<Message[]>([])
    const fileInput = useRef<HTMLInputElement>(null);

    const activeControllerRef = useRef<AbortController | null>(null);
    const activeReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);


    function abortCurrentRequest() {
            setMessages(prev => prev.map((message) => {
                if (message.role === 'assistant' && message.isThinking) {
                    return { ...message, isThinking: false };
                }
                return message;
            }));
            if (activeControllerRef.current) {
                activeControllerRef.current.abort();
                console.log('Aborting current request', activeControllerRef.current);
                activeControllerRef.current = null;
            }
            if (activeReaderRef.current) {
                activeReaderRef.current.cancel().catch(() => {});
                console.log('Cancelling current reader', activeReaderRef.current);
                activeReaderRef.current = null;
            }
            console.log('Current request aborted');
        }


    function updateAssistantById(assistantId: number, content?: string,thinkingData?:string,isThinking?:boolean) {
        if(content !== undefined) {
            setMessages(prev => prev.map(message => {
                if (message.id === assistantId && message.role === 'assistant') {
                    return { ...message, content };
                }
                return message;
            }));
        }
        if(thinkingData !== undefined || isThinking !== undefined) {
            setMessages(prev => prev.map((message) => {
                if (message.id === assistantId && message.role === 'assistant') {
                    return {
                        ...message,
                        isThinking,
                        thinkingData: thinkingData ?? message.thinkingData,
                    };
                }
                return message;
            }));
        }
    }


    async function readSseAnswerStream(response: Response, assistantId: number,signal: AbortSignal) {
        if (!response.body) throw new Error('Response body is empty');
        const reader = response.body.getReader();
        activeReaderRef.current = reader;
        const decoder = new TextDecoder();
        let assistantMessageText = '';
        let done = false;
        
        let rafId: number | null = null;

        const parser = createParser({
            onEvent(event){
                const eventType = (event.event ?? '').trim();//去除空格避免影响判断
                const payload = (event.data ?? '').trim();
                let parsedData: unknown = null;

                if (eventType === 'answer') {// 尝试解析 JSON 数据，这个返回只有JSON和[DONE]两种情况
                    try {
                        parsedData = JSON.parse(payload);
                    } catch {
                        parsedData = null;
                    }
                }

                //中间状态处理
                if (eventType === 'parsing_input') {
                    updateAssistantById(assistantId, undefined, event.data ?? '正在理解用户问题中', true);
                }
                if (eventType === 'fetching_context') {
                    updateAssistantById(assistantId, undefined, event.data ?? '获取背景信息中', true);
                }
                if (eventType === 'reasoning') {
                    updateAssistantById(assistantId, undefined, event.data ?? '思考中', true);
                }


                if(eventType === 'done'  || isDoneData(parsedData)){
                    updateAssistantById(assistantId, undefined, undefined, false);
                    if(isDoneData(parsedData)) {
                        const data = parsedData;
                        setMessages(prev =>
                            prev.map((msg) => {
                                if (msg.role === 'user' && msg.cliendId === data.client_user_id) {
                                    return { ...msg, id: data.userid, parent_id: data.user_parent_id };
                                }
                                if (msg.role === 'assistant' && msg.cliendId === data.client_assistant_id) {
                                    return { ...msg, id: data.assistantid, parent_id: data.assistant_parent_id };
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
                    updateAssistantById(assistantId, undefined, undefined, false);
                    const data = (parsedData ?? JSON.parse(payload)) as { answer?: string };
                    if(typeof data.answer !== 'string' || !data.answer) return;
                    assistantMessageText += data.answer;
                    if(!rafId){
                        rafId = requestAnimationFrame(() => {
                            updateAssistantById(assistantId, assistantMessageText,undefined, true);
                            rafId = null; // 执行完后清理 ID，允许下一帧调度
                        });                        
                    }
                }catch{
                    throw new Error('Failed to parse SSE data');
                }
        }});
        try {
            while(!done) {
                if (signal.aborted) {
                    await reader.cancel().catch(() => {});
                    throw new DOMException("Aborted", "AbortError");
                }

                const { value, done } = await reader.read();
                if(done) break;
                if(!value) continue;
                parser.feed(decoder.decode(value, { stream: true }));
                console.log('Received chunk:', decoder.decode(value, { stream: true }));
            }
            parser.feed(decoder.decode());
        }finally {
            if (activeReaderRef.current === reader) {
                activeReaderRef.current = null;
            }
        }
        //清理遗留的 raf 调度，确保最终结果被正确更新
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
        }
        updateAssistantById(assistantId, assistantMessageText, undefined, false);
    }
     function handleFileupload(e: React.ChangeEvent<HTMLInputElement>){
        const files = e.target.files;
        const validFiles = Array.from(files ?? []).filter(file => SUPPORTED_MIME_TYPES.includes(file.type));
        if(validFiles.length > 0)setFiles(prev => [...(prev ?? []), ...validFiles]);
        else toast.error("Please upload a file with a supported MIME type.");
    }

    const handleFileDrop=(e: React.DragEvent<HTMLDivElement>) => {
        handleDrop(e);

        const droppedFile = e.dataTransfer?.files;
        const validFiles = Array.from(droppedFile ?? []).filter(file => SUPPORTED_MIME_TYPES.includes(file.type));
        if (validFiles.length > 0) {
            setFiles(prev => [...(prev ?? []), ...validFiles]);
        } else {
            toast.error("Unsupported file type");
        }
    }

    async function fetchPostAnswer(question: string) {
        abortCurrentRequest();

        if (!question.trim()) return;

        const controller = new AbortController();


        setQuestion('');
        setFiles(null);
        setIsAnswering(true);
        const userId = Messages.length + 1;
        const userCliendId = `user-${Date.now()}-${userId}`;
        const assistantId = Messages.length + 2;
        const assistantCliendId = `assistant-${Date.now()}-${assistantId}`;
        setMessages(prev => [
            ...prev,
            {
                id: userId,
                role: 'user',
                content: question,
                cliendId: userCliendId,
                parent_id: null,
                nodeLabels: selectedNodes.map(node => node.data.label),
            },
            {
                id: assistantId,
                role: 'assistant',
                content: '',
                cliendId: assistantCliendId,
                parent_id: userId,
                nodeLabels: selectedNodes.map(node => node.data.label),
                isThinking: true,
                thinkingData: '',
            },
        ]);

        try {

            activeControllerRef.current = controller;

            const node_ids = selectedNodes.map(node => node.id);
            const formData = new FormData();
            formData.append('message', question);
            formData.append('id','1');
            formData.append('client_user_id', userCliendId);
            formData.append('client_assistant_id', assistantCliendId);
            formData.append('node_ids', node_ids.join(','));
            formData.append('include_background_info', includeBackgroundInfo ? '1' : '0');

            if(files) {
                for(const file of files) {
                    formData.append('file', file);
                }
            }
            console.log(formData)
            const response = await fetch('/api/chat', {
                method: 'POST',
                body:formData,
                signal: controller.signal,
            });
            if (!response.ok) throw new Error('Network response was not ok');
            await readSseAnswerStream(response, assistantId, controller.signal);
        }catch (error) {
            toast.error(`Failed to fetch answer: ${(error as Error).message}`);
        } 
        finally {
                if (activeControllerRef.current === controller) {
                    activeControllerRef.current = null;
                }
                 setIsAnswering(false);
        }
    }

    async function fetchPutAnswer(node_id=1,message_id:number,role:"user"|"assistant",message?:string) {
        abortCurrentRequest();

        const controller = new AbortController();

        setIsAnswering(true);
        const targetAssistant =
            role === 'user'
                ? Messages.find(msg => msg.role === 'assistant' && msg.parent_id === message_id)
                : Messages.find(msg => msg.id === message_id && msg.role === 'assistant');
        const sseAssistantId = targetAssistant?.id ?? message_id;

        setMessages(prev =>
            prev.map((msg) => {
                const shouldUpdate =
                    role === 'user'
                        ? msg.role === 'assistant' && msg.parent_id === message_id
                        : msg.id === message_id;

                if (!shouldUpdate) return msg;
                return { ...msg, content: '', isThinking: true, thinkingData: '' };
            })
        );
        const body: RegenerateBody = { node_id, message_id, role };
        if (message) body.message = message;
        try{
            activeControllerRef.current = controller;
            const response = await fetch('/api/chat', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            if (!response.ok) throw new Error('Network response was not ok');
            await readSseAnswerStream(response, sseAssistantId, controller.signal);
        }catch (error) {
            toast.error(`Failed to fetch answer: ${(error as Error).message}`);
        }finally {
                if (activeControllerRef.current === controller) {
                    activeControllerRef.current = null;
                }
                setIsAnswering(false);
        }
    }
    const fetchmessages = useCallback(async () => {
        const data = await chatAPi.Get(selectedNodes.map(node => node.id));
        setMessages(
            data.messages.map((item: backMessage) => ({
                id: item.id,
                parent_id: item.parent_id,
                role: item.role,
                content: item.content,
                cliendId: `${item.role}-${Date.now()}-${item.id}`,
                nodeLabels: (item.node_links ?? [])
                    .map((link) => link.node?.data?.label)
                    .filter((label): label is string => Boolean(label)),//is实现类型收窄
                isThinking: false,
                thinkingData: '',
            }))
        );
        setLoading(false);
    }, [selectedNodes]);
    useEffect(()=>{
        try{
        fetchmessages();
        }catch(error){
            toast.error(`Failed to fetch messages: ${(error as Error).message}`);
        }
    },[fetchmessages])
    return (
        <div className={`${className} relative overflow-hidden ${Loading ? 'animate-pulse' : ''}`} {...bind} onDrop={handleFileDrop}>
            {/* 背景信息部分 */}
            <div className="absolute bottom-1 left-15 z-20  -translate-x-1/2  border-gray-200 bg-transparent ">
                <label className="mt-2 flex items-center gap-2 text-xs text-gray-600 select-none">
                    <span>加入背景图信息</span>                   
                    <input
                        type="checkbox"
                        checked={includeBackgroundInfo}
                        onChange={(e) => setIncludeBackgroundInfo(e.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                </label>
            </div>

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

            {/*消息列表部分*/}
            {Loading ? <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 "><div className="animate-spin-custom"><Loader className="w-8 h-8" /></div></div>:<MessageQueue Messages={Messages} retry={fetchPutAnswer} setMessages={setMessages} />}

            {/* 关闭按钮 */}
            <button onClick={onClose} className="absolute top-4 right-4">X</button>

            {/*消息预加载处理*/}
            {Loading?'':<div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[650px] flex flex-col overflow-hidden rounded-3xl border border-gray-300 bg-white">
            
                {/* 文件列表 */}
                <div className={`mb-2 group pl-2 pt-2 flex flex-wrap gap-2 max-h-[120px] overflow-y-auto ${files ? 'block' : 'hidden'}`}>
                    {files&&files.map((file,index)=>(
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur border border-gray-200 rounded  text-gray-700 hover:bg-black/10 w-[200px] h-[60px]">
                                    <div className="bg-blue-500 text-white rounded-sm w-8 h-8 flex items-center justify-center flex-shrink-0"><FileChartColumnIncreasing className="w-4 h-4" /> </div>
                                    <span className="max-w-[160px] truncate">{file.name}</span>
                                    <button
                                    onClick={() => setFiles(prev => prev ? prev.filter((_, i) => i !== index) : null)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 self-start text-xs">X</button>
                                </div>
                            ))}
                </div>
                {/* 实际输入框 */}
                <Input   question={question} setQuestion={setQuestion} onSubmit={fetchPostAnswer} isAnswering={isAnswering} fileInput={()=>fileInput?.current?.click()} abortRequest={abortCurrentRequest}/>
            
            </div>}

            {/* 隐藏文件上传input */}
            <input type="file" className="hidden" onChange={handleFileupload} ref={fileInput} multiple/>
        </div>)
}