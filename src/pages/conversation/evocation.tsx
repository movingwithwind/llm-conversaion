import Input from "./input";
import MessageQueue from "./Message-quene";
import {  useState } from "react";

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
        let buffer = '';
        let assistantMessageText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;

            buffer += decoder.decode(value, { stream: true });
            const frames = buffer.split('\n\n');
            buffer = frames.pop() ?? '';

            for (const frame of frames) {
                const lines = frame.split('\n');
                let eventName = '';
                let dataText = '';

                for (const rawLine of lines) {
                    const line = rawLine.trim();
                    if (line.startsWith('event:')) {
                        eventName = line.slice(6).trim();
                    } else if (line.startsWith('data:')) {
                        dataText = line.slice(5).trim();
                    }
                }

                if (!eventName || !dataText) continue;
                if (eventName === 'done' || dataText === '[DONE]') return;
                if (eventName !== 'answer') continue;

                try {
                    const parsed = JSON.parse(dataText) as { answer?: string };
                    if (!parsed.answer) continue;

                    assistantMessageText += parsed.answer;
                    updateAssistantMessageById(assistantId, assistantMessageText);
                } catch {
                    continue;
                }
            }
        }

        const tail = decoder.decode();
        if (tail) {
            assistantMessageText += tail;
            updateAssistantMessageById(assistantId, assistantMessageText);
        }
    }

    async function fetchAnswer(question: string) {
        if (!question.trim()) return;

        setQuestion('');
        setIsAnswering(true);
        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), role: 'user', content: question },
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
        } finally {
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