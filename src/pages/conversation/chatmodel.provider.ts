import { createContext, createElement, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

type ChatModelContextValue = {
	ChatModel: string;
	setChatModel: Dispatch<SetStateAction<string>>;
};
//创建context对象，提供订阅和调用
const ChatModelContext = createContext<ChatModelContextValue | undefined>(undefined);

type ChatModelProviderProps = {
	children: ReactNode;
	initialChatModel?: string;
};

export function ChatModelProvider({//提供订阅
	children,
	initialChatModel = "qwen3.5-flash",
}: ChatModelProviderProps) {
	const [ChatModel, setChatModel] = useState(initialChatModel);

	return createElement(
		ChatModelContext.Provider,
		{
			value: {
				ChatModel,
				setChatModel,
			},
		},
		children,
	);
}

export function useChatModelContext() {//提供出去调用
	const context = useContext(ChatModelContext);

	if (!context) {
		throw new Error("useChatModelContext must be used within a ChatModelProvider");
	}

	return context;
}