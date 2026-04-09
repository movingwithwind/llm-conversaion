declare module 'dagre' {
  export const graphlib: {
    Graph: new () => {
      setDefaultEdgeLabel(fn: () => Record<string, unknown>): void;
      setGraph(graph: Record<string, unknown>): void;
      setNode(id: string, value: { width: number; height: number }): void;
      setEdge(source: string, target: string): void;
      node(id: string): { x: number; y: number };
    };
  };

  export function layout(graph: unknown): void;
}
