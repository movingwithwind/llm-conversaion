import dagre from 'dagre';
import type { nodeschemaType, edgeschemaType } from '../../api/schema';
import { type GraphLayout } from "./data";

const RING_GAP = 360;
const MIN_SECTOR_GAP = Math.PI / 24;
const NODE_ANCHOR_OFFSET = 58;

function selectCenterNodeId(nodes: nodeschemaType): string {
  return nodes[0]?.id ?? '';
}

function sortIds(ids: string[]): string[] {
  return [...ids].sort((left, right) => {
    const leftNumber = Number(left);
    const rightNumber = Number(right);

    if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) {
      return left.localeCompare(right);
    }

    return leftNumber - rightNumber;
  });
}

export function layoutGraph(nodes: nodeschemaType, edges: edgeschemaType, layout: GraphLayout) {
  if (layout === 'Hierarchical layout') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  g.setGraph({
    rankdir: 'TB',

    nodesep: 60,
    ranksep: 120,
    edgesep: 10,

    marginx: 20,
    marginy: 20,

    ranker: 'network-simplex',
  });

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
  }else {
      if (nodes.length === 0) {
        return { nodes, edges };
      }

      const centerId = selectCenterNodeId(nodes);
      const outgoing = new Map<string, string[]>();//父子节点关系存储

      nodes.forEach((node) => {
        outgoing.set(node.id, []);
      });

      edges.forEach((edge) => {
        const list = outgoing.get(edge.source);
        if (list) {
          list.push(edge.target);
        }
      });

      outgoing.forEach((children, nodeId) => {
        outgoing.set(nodeId, sortIds(children));
      });

      const levelById = new Map<string, number>();
      const queue: string[] = [];
      const parentById = new Map<string, string | null>();

      if (centerId) {
        levelById.set(centerId, 0);
        parentById.set(centerId, null);
        queue.push(centerId);
      }

      while (queue.length > 0) {//BFS遍历图，计算每个节点的层级
        const currentId = queue.shift() as string;
        const currentLevel = levelById.get(currentId) ?? 0;
        const neighbors = outgoing.get(currentId) ?? [];

        neighbors.forEach((nextId) => {
          if (!levelById.has(nextId)) {
            levelById.set(nextId, currentLevel + 1);
            parentById.set(nextId, currentId);
            queue.push(nextId);
          }
        });
      }

      let maxLevel = 0;//计算最大层级，以便后续分配环形位置
      levelById.forEach((level) => {
        if (level > maxLevel) {
          maxLevel = level;
        }
      });

      nodes.forEach((node) => {
        if (!levelById.has(node.id)) {
          maxLevel += 1;
          levelById.set(node.id, maxLevel);
          parentById.set(node.id, null);
        }
      });

      const treeChildren = new Map<string, string[]>();
      nodes.forEach((node) => {
        treeChildren.set(node.id, []);
      });

      parentById.forEach((parentId, childId) => {
        if (!parentId) {
          return;
        }

        const list = treeChildren.get(parentId);
        if (list) {
          list.push(childId);
        }
      });

      treeChildren.forEach((children, nodeId) => {
        treeChildren.set(nodeId, sortIds(children));
      });

      const subtreeSpanById = new Map<string, number>();

      const measureSubtree = (nodeId: string): number => {
        const cached = subtreeSpanById.get(nodeId);
        if (cached !== undefined) {
          return cached;
        }

        const children = treeChildren.get(nodeId) ?? [];
        if (children.length === 0) {
          subtreeSpanById.set(nodeId, 1);
          return 1;
        }

        const totalSpan = children.reduce((sum, childId) => sum + measureSubtree(childId), 0);
        subtreeSpanById.set(nodeId, totalSpan);
        return totalSpan;
      };

      measureSubtree(centerId);

      const positioned = new Set<string>();
      const positionById = new Map<string, { x: number; y: number }>();

      const placeNode = (
        nodeId: string,
        startAngle: number,
        endAngle: number,
        depth: number,
      ) => {
        const angle = depth === 0 ? 0 : (startAngle + endAngle) / 2;
        const radius = depth === 0 ? 0 : depth * RING_GAP;

        positionById.set(nodeId, {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        });
        positioned.add(nodeId);

        const children = treeChildren.get(nodeId) ?? [];
        if (children.length === 0) {
          return;
        }

        const span = endAngle - startAngle;
        const childSpanTotal = children.reduce((sum, childId) => sum + (subtreeSpanById.get(childId) ?? 1), 0);
        const usableSpan = Math.max(span - MIN_SECTOR_GAP * Math.max(0, children.length - 1), MIN_SECTOR_GAP * children.length);

        let cursor = startAngle;
        children.forEach((childId, index) => {
          const childWeight = subtreeSpanById.get(childId) ?? 1;
          const childSpan = usableSpan * (childWeight / childSpanTotal);
          const childStart = cursor;
          const childEnd = index === children.length - 1 ? endAngle : cursor + childSpan;

          placeNode(childId, childStart, childEnd, depth + 1);
          cursor = childEnd + MIN_SECTOR_GAP;
        });
      };

      placeNode(centerId, 0, Math.PI * 2, 0);

      const unpositioned = nodes.filter((node) => !positioned.has(node.id));
      if (unpositioned.length > 0) {
        const fallbackRadius = (maxLevel + 1) * RING_GAP;
        const step = (Math.PI * 2) / unpositioned.length;
        unpositioned.forEach((node, index) => {
          positionById.set(node.id, {
            x: Math.cos(index * step) * fallbackRadius,
            y: Math.sin(index * step) * fallbackRadius,
          });
        });
      }

      nodes.forEach((node) => {
        const positionedNode = positionById.get(node.id);
        if (positionedNode) {
          node.position = positionedNode;
          return;
        }

        node.position = { x: 0, y: 0 };
      });

      const anchorById = new Map<string, { x: number; y: number }>();

      const getAnchorPoint = (fromId: string, toId: string) => {
        const from = positionById.get(fromId) ?? { x: 0, y: 0 };
        const to = positionById.get(toId) ?? { x: 0, y: 0 };
        const deltaX = to.x - from.x;
        const deltaY = to.y - from.y;
        const distance = Math.hypot(deltaX, deltaY) || 1;
        const unitX = deltaX / distance;
        const unitY = deltaY / distance;

        return {
          sourcePoint: {
            x: from.x + unitX * NODE_ANCHOR_OFFSET,
            y: from.y + unitY * NODE_ANCHOR_OFFSET,
          },
          targetPoint: {
            x: to.x - unitX * NODE_ANCHOR_OFFSET,
            y: to.y - unitY * NODE_ANCHOR_OFFSET,
          },
        };
      };

      edges.forEach((edge) => {
        const anchors = getAnchorPoint(edge.source, edge.target);
        anchorById.set(edge.id, anchors.sourcePoint);
      });
  }
  return { nodes, edges };
}