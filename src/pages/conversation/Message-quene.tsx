
type MessageQueueProps = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}[];

export default function MessageQueue( {Messages}: {Messages: MessageQueueProps}) {
    return <div className="flex flex-col gap-2 mb-16 overflow-y-scroll h-full p-6">
    {Messages.map((message) => (
        <div key={message.id} className={`p-4 rounded-lg mb-2 ${message.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'}`}>
            {message.content}
        </div>
    ))}
    </div>
}