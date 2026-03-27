import Input from "./input";
import MessageQueue from "./Message-quene";
import {  useState,useEffect } from "react";
import {toast} from"sonner"
import { Loader } from 'lucide-react';
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
    const [question, setQuestion] = useState('');
    const [Loading, setLoading]=useState(true);
    const [isAnswering, setIsAnswering] = useState(false);
    const [Messages, setMessages] = useState<Message[]>([])

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
            const JsonBody = { id:1,message: question };
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(JsonBody)
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
        <div className={`${className} relative overflow-hidden ${Loading ? 'animate-pulse' : ''}`}>
            {Loading ? <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 "><div className="animate-spin-custom"><Loader className="w-8 h-8" /></div></div>:<MessageQueue Messages={Messages} />}
            <button onClick={onClose} className="absolute top-4 right-4">X</button>
            <Input  className="fixed bottom-8 left-1/2 -translate-x-1/2" question={question} setQuestion={setQuestion} onSubmit={fetchAnswer} isAnswering={isAnswering} />
        </div>)
}