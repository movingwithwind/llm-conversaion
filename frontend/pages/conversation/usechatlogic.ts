// src/pages/conversation/useChatLogic.ts
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createParser } from 'eventsource-parser';
import { chatAPi } from "../../lib/api/chat";
import type { nodeschemaType } from "../../lib/api/schema";

export type Message = {
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
    model: string;
};

export function useChatLogic(selectedNodes: nodeschemaType, _chatModel: string) {

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


    const [Messages, setMessages] = useState<Message[]>([]);
    const [isAnswering, setIsAnswering] = useState(false);
    const [Loading, setLoading] = useState(true);

    const activeControllerRef = useRef<AbortController | null>(null);
    const activeReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

    // 1. 中断请求逻辑
    const abortCurrentRequest = useCallback(() => {
        setMessages(prev => prev.map((message) => {
            if (message.role === 'assistant' && message.isThinking) {
                return { ...message, isThinking: false };
            }
            return message;
        }));
        if (activeControllerRef.current) activeControllerRef.current.abort();
        if (activeReaderRef.current) activeReaderRef.current.cancel().catch(() => {});
        activeControllerRef.current = null;
        activeReaderRef.current = null;
    }, []);

    // 2. 状态更新辅助函数
    const updateAssistantById = useCallback((assistantId: number, content?: string, thinkingData?: string, isThinking?: boolean) => {
        setMessages(prev => prev.map(message => {
            if (message.id !== assistantId || message.role !== 'assistant') return message;
            
            const updated = { ...message };
            if (content !== undefined) updated.content = content;
            if (isThinking !== undefined) updated.isThinking = isThinking;
            if (thinkingData !== undefined) updated.thinkingData = thinkingData;
            return updated;
        }));
    }, []);

    // 3. SSE 读取核心逻辑
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
                console.log('Received SSE event:', { eventType, payload });

                try {
                    parsedData = JSON.parse(payload);
                } catch {
                    parsedData = null;
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
                    console.log('Received done event or done data:', eventType, parsedData);
                    updateAssistantById(assistantId, undefined, undefined, false);
                    if(isDoneData(parsedData)) {
                        const data = parsedData;
                        setMessages(prev =>
                            prev.map((msg) => {
                                if (msg.role === 'user' && msg.cliendId === data.client_user_id) {
                                    console.log('Updating user message with ID:', msg.id, 'using client_user_id:', data.client_user_id);
                                    return { ...msg, id: data.userid, parent_id: data.user_parent_id };
                                }
                                if (msg.role === 'assistant' && msg.cliendId === data.client_assistant_id) {
                                    console.log('Updating assistant message with ID:', msg.id, 'using client_assistant_id:', data.client_assistant_id);
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
                            updateAssistantById(assistantId, assistantMessageText,undefined,false);
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

    // 4. 初次加载消息
    const fetchMessages = useCallback(async () => {
        try {
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
                        .filter((label): label is string => Boolean(label)),
                    isThinking: false,
                    thinkingData: '',
                }))
            );
        } catch (error) {
            toast.error(`Failed to fetch messages: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    }, [selectedNodes]);

    // 5. POST 和 PUT 发送逻辑
    async function fetchPostAnswer(question: string, files: File[] | null, includeBackgroundInfo: boolean, ChatModel: string) {
        abortCurrentRequest();

        if (!question.trim()) return;

        const controller = new AbortController();

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
            formData.append('model', ChatModel);

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

    async function fetchPutAnswer(node_id=1,message_id:number,role:"user"|"assistant",message?:string, ChatModel?: string) {
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
        const body: RegenerateBody = { node_id, message_id, role, model: ChatModel! };
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

    return {
        Messages,
        setMessages,
        isAnswering,
        Loading,
        fetchMessages,
        fetchPostAnswer,
        fetchPutAnswer,
        abortCurrentRequest
    };
}