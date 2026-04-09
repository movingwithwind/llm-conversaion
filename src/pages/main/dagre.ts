import dagre from 'dagre';
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
    type: 'smoothstep';
}
export function layoutGraph(nodes: FrontNode[], edges: FrontEdge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  g.setGraph({ rankdir: 'TB' }); // TB = 上到下

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 200, height: 80 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  nodes.forEach((node) => {
    const pos = g.node(node.id);
    node.position = {
      x: pos.x,
      y: pos.y,
    };
  });

  return { nodes, edges };
}