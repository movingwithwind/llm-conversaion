export type BackNode={
    id:number;
    title: string;
    description: string;
}
export type BackEdge={
    from:number;
    to:number;
    condition: string;
}
export type NodeData = {
  label: string;
  description: string;
};
export type FrontNode={
  id:string;
    type?: 'thoughtNode';
    data: NodeData;
    position: { x: number; y: number };
}
export type FrontEdge={
    id:string;
  source:string;
  target:string;
    label: string;
    type: 'smoothstep' | 'slanted';
}
export function NodesBackToFront(backNodes: BackNode[]): FrontNode[] {
  return backNodes.map((node) => ({
    id: node.id.toString(),
    type: 'thoughtNode',
    data: {
      label: node.title,
      description: node.description,
    },
    position: { x: 0, y: 0 },
  }));
}
export function EdgesBackToFront(backEdges: BackEdge[]): FrontEdge[] {
  return backEdges.map((edge) => ({
    id: `${edge.from}-${edge.to}`,
    source: edge.from.toString(),
    target: edge.to.toString(),
    label: edge.condition,
    type: 'smoothstep',
  }));
}

