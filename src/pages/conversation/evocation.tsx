import Input from "./input";
import MessageQueue from "./Message-quene";
import {  useState } from "react";
import {toast} from"sonner"
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
    const [isAnswering, setIsAnswering] = useState(false);
    const [Messages, setMessages] = useState<Message[]>([
                {id: '1', role: 'user', content: 'Hello, how are you?'},
                {id: '2', role: 'assistant', content: 'I am fine, thank you! How can I assist you today?'},
                {id: '3', role: 'user', content: 'Can you tell me a joke?'},
                {id: '4', role: 'assistant', content: 'Sure! Why don\'t scientists trust atoms? Because they make up everything!'},
                {id: '5', role: 'user', content: 'Haha, that\'s a good one! Can you tell me another joke?'},
                {id: '6', role: 'assistant', content: 'Of course! Why did the scarecrow win an award? Because he was outstanding in his field!'},
                {id: '7', role: 'user', content: 'Haha, you\'re really good at jokes! Can you tell me one more?'},
                {id: '8', role: 'assistant', content: 'Thank you! Here\'s one more: Why don\'t skeletons fight each other? They don\'t have the guts!'},
                {id: '9', role: 'user', content: 'Haha, that\'s hilarious! Thanks for the jokes!'},
                {id: '10', role: 'assistant', content: 'You\'re welcome! If you have any other questions or need assistance, feel free to ask!'},
                {id: '11', role: 'user', content: 'Actually, I do have one more question. Can you tell me a fun fact?'},
            ])

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
                    updateAssistantMessageById(assistantId, assistantMessageText);
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
            const JsonBody = { message: question };
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
    return <>
        <div className={`${className} relative overflow-hidden`}>
            <MessageQueue Messages={Messages} />
            <button onClick={onClose} className="absolute top-4 right-4">X</button>
            <Input  className="absolute bottom-2 w-4/5 left-1/2 -translate-x-1/2" question={question} setQuestion={setQuestion} onSubmit={fetchAnswer} isAnswering={isAnswering} />
        </div>
    </>
}