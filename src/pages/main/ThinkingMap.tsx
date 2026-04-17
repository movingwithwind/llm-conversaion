import ReactFlow, { Background, BackgroundVariant, Controls, Handle, Position, useEdgesState, useNodesState, type NodeProps } from "reactflow"
import "reactflow/dist/style.css";
import { layoutGraph} from "./dagre";
import { type FrontEdge, type FrontNode,type NodeData,type GraphLayout } from "./data";
import { useLayoutEffect, useMemo } from "react";


function ThoughtNode({ data, selected }: NodeProps<NodeData>) {
  return (
    <div
      className={`min-w-[100px] max-w-[240px] rounded-2xl border px-4 py-3 backdrop-blur-md transition-all duration-200 ${
        selected
          ? 'border-sky-400/70 bg-white/92 shadow-[0_10px_30px_rgba(59,130,246,0.18)] ring-2 ring-sky-300/35'
          : 'border-slate-300/55 bg-white/72 shadow-[0_10px_24px_rgba(100,116,139,0.16)] hover:border-sky-300/70 hover:bg-white/85'
      }`}
    >
      {/* 节点连接，进入节点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!absolute !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !h-3 !w-3 !border-2 !bg-transparent !-z-10"
      />
      <div className="space-y-2">
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

function RadialNode({ data, selected }: NodeProps<NodeData>) {
  return (
    <div
      className={`group relative flex h-40 w-40 flex-col items-center justify-center rounded-full border px-5 text-center backdrop-blur-md transition-all duration-200 ${
        selected
          ? 'border-sky-400/70 bg-white/92 shadow-[0_10px_30px_rgba(59,130,246,0.18)] ring-2 ring-sky-300/35'
          : 'border-slate-300/55 bg-white/72 shadow-[0_10px_24px_rgba(100,116,139,0.16)] hover:border-sky-300/70 hover:bg-white/85'
      }`}
    >
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
      <Handle
        type="source"
        position={Position.Right}
        className="!absolute !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !h-3 !w-3 !border-2 !bg-transparent !-z-10"
      />
    </div>
  );
}

function ThinkingMap({initialnodes,initialedges,isgraphing,Layout,havinglayouted,PostMap}:{initialnodes:FrontNode[];initialedges:FrontEdge[];isgraphing:boolean,Layout:GraphLayout,havinglayouted:boolean,PostMap:(nodes:FrontNode[],edges:FrontEdge[],layout:GraphLayout)=>Promise<void>}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as FrontNode[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as FrontEdge[]);
  const nodeTypes = useMemo(
    () => ({
      thoughtNode: Layout === "Radial layout" ? RadialNode : ThoughtNode,
    }),
    [Layout],
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
