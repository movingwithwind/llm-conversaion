import { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import { StickToBottom } from 'use-stick-to-bottom';

type MessageQueueProps = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}[];

export default function MessageQueue({ Messages }: { Messages: MessageQueueProps }) {
  const md = useMemo(
    () =>
      new MarkdownIt({
        html: false,
        linkify: true,
        breaks: true,
        typographer: true,
      }),
    []
  );

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
              <div dangerouslySetInnerHTML={{ __html: md.render(message.content) }} />
            ) : (
              message.content
            )}
          </div>
        ))}
      </StickToBottom.Content>
    </StickToBottom>
  );
}