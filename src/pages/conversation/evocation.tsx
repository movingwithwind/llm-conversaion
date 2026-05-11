import Input from "./input";
import MessageQueue from "./Message-quene";
import {  useState,useEffect,useRef } from "react";
import {toast} from"sonner";
import { FileChartColumnIncreasing } from 'lucide-react';
import { useFileDrop } from "./useFileDrop";
import { SUPPORTED_MIME_TYPES } from "../../compents/FileType";
import {  Loader } from 'lucide-react';
import type { nodeschemaType } from "../../api/schema";
import { useChatLogic } from "./usechatlogic";

type EvocationProps = {
    className?: string;
    onClose: () => void;
    selectedNodes: nodeschemaType;
    ChatModel: string;
}

export default function Evocation({className, onClose, selectedNodes, ChatModel}: EvocationProps) {
    const {isDragging,bind,handleDrop}=useFileDrop();

    const [question, setQuestion] = useState('');
    const [includeBackgroundInfo, setIncludeBackgroundInfo] = useState(true);
    const [files, setFiles] = useState<File[] | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    const {
        Messages,
        setMessages,
        isAnswering,
        Loading,
        fetchMessages,
        fetchPostAnswer,
        fetchPutAnswer,
        abortCurrentRequest
    } = useChatLogic(selectedNodes, ChatModel);

    useEffect(() => {
        try {
            fetchMessages();
        } catch (error) {
            toast.error(`Failed to fetch messages: ${(error as Error).message}`);
        }
    }, [fetchMessages]);

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

    const handlePostSubmit = (q: string) => {
        fetchPostAnswer(q, files, includeBackgroundInfo, ChatModel);
        setQuestion('');
        setFiles(null);
    };

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
                <Input   question={question} setQuestion={setQuestion} onSubmit={handlePostSubmit} isAnswering={isAnswering} fileInput={()=>fileInput?.current?.click()} abortRequest={abortCurrentRequest}/>
            
            </div>}

            {/* 隐藏文件上传input */}
            <input type="file" className="hidden" onChange={handleFileupload} ref={fileInput} multiple/>
        </div>)
}