import { createContext, createElement, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

type GraphModelContextValue = {
	GraphModel: string;
	setGraphModel: Dispatch<SetStateAction<string>>;
};

const GraphModelContext = createContext<GraphModelContextValue | undefined>(undefined);

type GraphModelProviderProps = {
	children: ReactNode;
	initialGraphModel?: string;
};

export function GraphModelProvider({
	children,
	initialGraphModel = "qwen3.5-flash",
}: GraphModelProviderProps) {
	const [GraphModel, setGraphModel] = useState(initialGraphModel);

	return createElement(
		GraphModelContext.Provider,
		{
			value: {
				GraphModel,
				setGraphModel,
			},
		},
		children,
	);
}

export function useGraphModelContext() {
	const context = useContext(GraphModelContext);

	if (!context) {
		throw new Error("useGraphModelContext must be used within a GraphModelProvider");
	}

	return context;
}





