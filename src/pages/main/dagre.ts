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

const RING_GAP = 260;
const SINGLE_NODE_RING_GAP = 160;

function selectCenterNodeId(nodes: FrontNode[]): string {
  return nodes[0]?.id ?? '';
}

export function layoutGraph(nodes: FrontNode[], edges: FrontEdge[]) {
  if (nodes.length === 0) {
    return { nodes, edges };
  }

  const centerId = selectCenterNodeId(nodes);
  const outgoing = new Map<string, string[]>();

  nodes.forEach((node) => {
    outgoing.set(node.id, []);
  });

  edges.forEach((edge) => {
    const list = outgoing.get(edge.source);
    if (list) {
      list.push(edge.target);
    }
  });

  const levelById = new Map<string, number>();
  const queue: string[] = [];

  if (centerId) {
    levelById.set(centerId, 0);
    queue.push(centerId);
  }

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const currentLevel = levelById.get(currentId) ?? 0;
    const neighbors = outgoing.get(currentId) ?? [];

    neighbors.forEach((nextId) => {
      if (!levelById.has(nextId)) {
        levelById.set(nextId, currentLevel + 1);
        queue.push(nextId);
      }
    });
  }

  let maxLevel = 0;
  levelById.forEach((level) => {
    if (level > maxLevel) {
      maxLevel = level;
    }
  });

  nodes.forEach((node) => {
    if (!levelById.has(node.id)) {
      maxLevel += 1;
      levelById.set(node.id, maxLevel);
    }
  });

  const ringBuckets = new Map<number, FrontNode[]>();

  nodes.forEach((node) => {
    const level = levelById.get(node.id) ?? 0;
    const bucket = ringBuckets.get(level) ?? [];
    bucket.push(node);
    ringBuckets.set(level, bucket);
  });

  ringBuckets.forEach((ringNodes, level) => {
    if (level === 0) {
      ringNodes.forEach((node, index) => {
        if (index === 0) {
          node.position = { x: 0, y: 0 };
        } else {
          const angle = (Math.PI * 2 * (index - 1)) / Math.max(1, ringNodes.length - 1);
          const radius = SINGLE_NODE_RING_GAP;
          node.position = {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          };
        }
      });
      return;
    }

    const radius = level * RING_GAP;
    const count = ringNodes.length;
    ringNodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / count;
      node.position = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  });

  return { nodes, edges };
}