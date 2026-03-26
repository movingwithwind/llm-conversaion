import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { StickToBottom } from 'use-stick-to-bottom';
import CodePre from '../../compents/CodePre';

type MessageQueueProps = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}[];

export default function MessageQueue({ Messages }: { Messages: MessageQueueProps }) {

  return (
    <StickToBottom className='h-full overflow-y-auto' initial='smooth' resize='smooth'>
      <StickToBottom.Content className='flex flex-col gap-2 mb-16 p-6'>
        {Messages.map((message) => (
          <div
            key={message.id}
            className={'p-4 rounded-lg mb-2 ' + (message.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start')}
            id={message.id}
          >
            {message.role === 'assistant' ? (
              <div className='prose prose-sm max-w-none'>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
                  components={{ pre: CodePre }}
                >
                    {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              message.content
            )}
          </div>
        ))}
      </StickToBottom.Content>
    </StickToBottom>
  );
}