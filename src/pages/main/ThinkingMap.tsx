import ReactFlow, { Background, BackgroundVariant, Controls, Handle, Position, useEdgesState, useNodesState, type NodeProps } from "reactflow"
import "reactflow/dist/style.css";
import { layoutGraph} from "./dagre";
import type { nodeschemaType, edgeschemaType } from '../../api/schema';
import { type GraphLayout } from "./data";
import { useLayoutEffect, useMemo, type Dispatch, type SetStateAction } from "react";


function SelectNodeButton({
  node,
  selectedNodes,
  setSelectedNodes,
}: {
  node: nodeschemaType[number];
  selectedNodes: nodeschemaType;
  setSelectedNodes: Dispatch<SetStateAction<nodeschemaType>>;
}) {
  const isSelected = selectedNodes.some((selectedNode) => selectedNode.id === node.id);

  return (
    <button
      type="button"
      className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 ${
        isSelected
          ? 'border-sky-500 bg-sky-500 text-white shadow-[0_0_0_4px_rgba(14,165,233,0.12)]'
          : 'border-slate-300 bg-white/90 text-slate-400 hover:border-sky-400 hover:text-sky-500'
      }`}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        setSelectedNodes((currentNodes) => {
          if (currentNodes.some((selectedNode) => selectedNode.id === node.id)) {
            return currentNodes.filter((selectedNode) => selectedNode.id !== node.id);
          }

          return [...currentNodes, node];
        });
      }}
    >
      <span
        className={`block h-2.5 w-2.5 rounded-full border transition-all duration-200 ${
          isSelected ? 'border-white bg-white' : 'border-current bg-transparent'
        }`}
      />
    </button>
  );
}

type SelectableNodeProps = NodeProps<nodeschemaType[number]['data']> & {
  selectedNodes: nodeschemaType;
  setSelectedNodes: Dispatch<SetStateAction<nodeschemaType>>;
  messageCount?: number;
};

function formatMessageCount(count: number): string {
  return count/2 > 99 ? '99+' : String(count/2);
}

function ThoughtNode({ id, data, selected, selectedNodes, setSelectedNodes, messageCount }: SelectableNodeProps) {
  const node = {
    id,
    type: 'thoughtNode',
    message_count: messageCount,
    data,
    position: { x: 0, y: 0 },
    map_id: 0,
    _count: { message_links: messageCount || 0 }
  } as unknown as nodeschemaType[number];

  return (
    <div
      className={`relative min-w-[100px] max-w-[240px] rounded-2xl border px-4 py-3 backdrop-blur-md transition-all duration-200 ${
        selected
          ? 'border-sky-400/70 bg-white/92 shadow-[0_10px_30px_rgba(59,130,246,0.18)] ring-2 ring-sky-300/35'
          : 'border-slate-300/55 bg-white/72 shadow-[0_10px_24px_rgba(100,116,139,0.16)] hover:border-sky-300/70 hover:bg-white/85'
      }`}
    >
      {typeof messageCount === 'number' && messageCount > 0 && (
        <div className="absolute -left-1 -top-1 min-w-4 h-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-none text-white shadow-sm flex items-center justify-center">
          {formatMessageCount(messageCount)}
        </div>
      )}
      <SelectNodeButton node={node} selectedNodes={selectedNodes} setSelectedNodes={setSelectedNodes} />
      {/* 节点连接，进入节点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!absolute !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !h-3 !w-3 !border-2 !bg-transparent !-z-10"
      />
      <div className="space-y-2 pr-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-br from-sky-400 to-indigo-300 shadow-[0_0_14px_rgba(96,165,250,0.55)]" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-800">
            {data.label}
          </h3>
        </div>
        <p className="text-xs leading-5 text-slate-600/95">
          {data.description}
        </p>
      </div>
      {/* 节点连接，离开节点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!absolute !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !h-3 !w-3 !border-2 !bg-transparent !-z-10"
      />
    </div>
  );
}

function RadialNode({ id, data, selected, selectedNodes, setSelectedNodes, messageCount }: SelectableNodeProps) {
  const node = {
    id,
    type: 'thoughtNode',
    message_count: messageCount,
    data,
    position: { x: 0, y: 0 },
    map_id: 0,
    _count: { message_links: messageCount || 0 }
  } as unknown as nodeschemaType[number];

  return (
    <div
      className={`group relative flex h-40 w-40 flex-col items-center justify-center rounded-full border px-5 text-center backdrop-blur-md transition-all duration-200 ${
        selected
          ? 'border-sky-400/70 bg-white/92 shadow-[0_10px_30px_rgba(59,130,246,0.18)] ring-2 ring-sky-300/35'
          : 'border-slate-300/55 bg-white/72 shadow-[0_10px_24px_rgba(100,116,139,0.16)] hover:border-sky-300/70 hover:bg-white/85'
      }`}
    >
      {typeof messageCount === 'number' && messageCount > 0 && (
        <div className="absolute -left-1 -top-1 min-w-4 h-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-none text-white shadow-sm flex items-center justify-center">
          {formatMessageCount(messageCount)}
        </div>
      )}
      <Handle
        type="target"
        position={Position.Left}
        className="!absolute !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !h-3 !w-3 !border-2 !bg-transparent !-z-10"
      />
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-br from-sky-400 to-indigo-300 shadow-[0_0_14px_rgba(96,165,250,0.55)]" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-800">
            {data.label}
          </h3>
        </div>
        <div className="invisible absolute top-[110%] left-1/2 z-10  -translate-x-1/2 rounded-lg bg-white/95 p-3 text-xs leading-5 text-slate-600/95 opacity-100 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ring-1 ring-slate-200 transition-all duration-200  w-[130%]
        h-[55%] flex justify-center items-center group-hover:visible group-hover:opacity-100">
          <p>{data.description}</p>
        </div>
      </div>
      <SelectNodeButton node={node} selectedNodes={selectedNodes} setSelectedNodes={setSelectedNodes} />
      <Handle
        type="source"
        position={Position.Right}
        className="!absolute !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !h-3 !w-3 !border-2 !bg-transparent !-z-10"
      />
    </div>
  );
}

function ThinkingMap({initialnodes,initialedges,isgraphing,Layout,havinglayouted,PostMap,selectedNodes,setSelectedNodes}:{initialnodes:nodeschemaType;initialedges:edgeschemaType;isgraphing:boolean,Layout:GraphLayout,havinglayouted:boolean,PostMap:(nodes:nodeschemaType,edges:edgeschemaType,layout:GraphLayout)=>Promise<void>,selectedNodes:nodeschemaType,setSelectedNodes:Dispatch<SetStateAction<nodeschemaType>>}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as unknown as nodeschemaType);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as unknown as edgeschemaType);
  const messageCountMap = useMemo(() => {
    const map = new Map<string, number | undefined>();
    initialnodes.forEach((node) => {
      // @ts-expect-error type migration
      map.set(node.id, node.message_count);
    });
    return map;
  }, [initialnodes]);
  const nodeTypes = useMemo(
    () => ({
      thoughtNode: (props: NodeProps<nodeschemaType[number]['data']>) =>
        Layout === "Radial layout" ? (
          <RadialNode
            {...props}
            selectedNodes={selectedNodes}
            setSelectedNodes={setSelectedNodes}
            messageCount={messageCountMap.get(props.id)}
          />
        ) : (
          <ThoughtNode
            {...props}
            selectedNodes={selectedNodes}
            setSelectedNodes={setSelectedNodes}
            messageCount={messageCountMap.get(props.id)}
          />
        ),
    }),
    [Layout, selectedNodes, setSelectedNodes, messageCountMap],
  );
  useLayoutEffect( () => {
    if (isgraphing) {
      console.log('Initial nodes:', initialnodes);
      console.log('Initial edges:', initialedges);
      const {nodes, edges} =havinglayouted ? layoutGraph(initialnodes, initialedges, Layout) : {nodes: initialnodes, edges: initialedges};
      if(havinglayouted && PostMap) PostMap(nodes, edges, Layout);
      console.log('Initial havinglayouted:', havinglayouted);
      console.log('Layouted Graph:', {nodes, edges});
      setNodes(nodes);
      setEdges(edges);
    } else {
      return
    }
  }, [initialnodes, initialedges, isgraphing, Layout, setNodes, setEdges,havinglayouted,PostMap]);
  return (
    <div className="relative h-full overflow-hidden  border border-slate-300/60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.88),_rgba(240,245,255,0.78)_38%,_rgba(231,238,251,0.86)_100%)] p-4 md:p-8">
        {isgraphing ?   <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodeOrigin={[0.5, 0.5]}
        fitView
        fitViewOptions={{ padding: 0.05 }}
        minZoom={0.25}
        maxZoom={1.5}
        proOptions={{ hideAttribution: false }}
        defaultEdgeOptions={{
          animated: true,
          style: {
            stroke: 'rgba(100,116,139,0.42)',
            strokeWidth: 1.5,
          },
          labelStyle: {
            fill: 'rgba(51, 65, 85, 0.95)',
            fontSize: 12,
            fontWeight: 600,
          },
          labelBgStyle: {
            fill: 'rgba(255, 255, 255, 0.92)',
            stroke: 'rgba(148, 163, 184, 0.45)',
            strokeWidth: 1,
          },
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 8,
        }}
        className="rounded-2xl bg-transparent"
      >
        <Background variant={BackgroundVariant.Lines} color="rgba(148,163,184,0.28)" gap={20} size={1.2} />
        <Controls position="bottom-right" showInteractive={false} className="!rounded-xl !border !border-slate-300/70 !bg-white/80 !text-slate-700" />
      </ReactFlow>: <div className="flex items-center justify-center h-full text-slate-500">No graph to display</div>}
    </div>
  )
}

export default ThinkingMap
