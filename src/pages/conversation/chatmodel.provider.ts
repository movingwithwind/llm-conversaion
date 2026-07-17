import { createContext, createElement, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

type ChatModelContextValue = {
	ChatModel: string;
	setChatModel: Dispatch<SetStateAction<string>>;
};

const ChatModelContext = createContext<ChatModelContextValue | undefined>(undefined);

type ChatModelProviderProps = {
	children: ReactNode;
	initialChatModel?: string;
};

export function ChatModelProvider({
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

export function useChatModelContext() {
	const context = useContext(ChatModelContext);

	if (!context) {
		throw new Error("useChatModelContext must be used within a ChatModelProvider");
	}

	return context;
}