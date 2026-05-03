import type { graphnodeschemaType, graphedgeschemaType, nodeschemaType, edgeschemaType } from '../../api/schema';

export type GraphLayout = "Radial layout" | "Hierarchical layout";

export function NodesBackToFront(backNodes: graphnodeschemaType): nodeschemaType {
  return backNodes.map((node) => ({
    id: node.id.toString(),
    type: 'thoughtNode',
    data: {
      label: node.title,
      description: node.description,
    },
    position: { x: 0, y: 0 },
    map_id: 0,
    _count: {
        message_links: 0
    }
  }));
}

export function EdgesBackToFront(backEdges: graphedgeschemaType): edgeschemaType {
  return backEdges.map((edge) => ({
    id: `${edge.from}-${edge.to}`,
    source: edge.from.toString(),
    target: edge.to.toString(),
    label: edge.condition,
    type: 'messageLink',
    map_id: 0,
    created_at: new Date().toISOString(),
  }));
}

