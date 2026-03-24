import Input from "./input";
import MessageQueue from "./Message-quene";

type EvocationProps = {
    className?: string;
    onClose: () => void;
}



export default function Evocation({className, onClose}: EvocationProps) {

    return <>
        <div className={`${className} relative overflow-hidden`}>
            <MessageQueue Messages={[
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
            ]} />
            <button onClick={onClose} className="absolute top-4 right-4">X</button>
            <Input  className="absolute bottom-2 w-4/5 left-1/2 -translate-x-1/2" />
        </div>
    </>
}