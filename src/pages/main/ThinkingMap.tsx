import ReactFlow, { Background, BackgroundVariant, Controls, Handle, Position, useEdgesState, useNodesState, type NodeProps } from "reactflow"
import "reactflow/dist/style.css";
import { layoutGraph} from "./dagre";
import { type FrontEdge, type FrontNode,type NodeData } from "./data";
import {  useLayoutEffect} from "react";
const Nodes: FrontNode[] = [
  {
    id: '1775705345016',
    type: 'thoughtNode',
    data: {
      label: 'Web框架首页SEO优化方案',
      description: '对比Next.js、React等主流框架的首页SEO提升策略',
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '1775705344608',
    type: 'thoughtNode',
    data: {
      label: 'Next.js SEO策略',
      description: '服务端渲染和预渲染优先选择',
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '1775705344648',
    type: 'thoughtNode',
    data: {
      label: '动态页面优化',
      description: 'getServerSideProps获取最新内容提升索引',
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '1775705344577',
    type: 'thoughtNode',
    data: {
      label: 'React SSR/SSG优化',
      description: '配合第三方服务解决爬虫抓取问题',
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '1775705344947',
    type: 'thoughtNode',
    data: {
      label: '静态生成优化',
      description: 'prerender-spa-plugin等工具预渲染关键页面',
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '1775705344722',
    type: 'thoughtNode',
    data: {
      label: '元数据管理',
      description: 'react-helmet-dynamic设置动态标题描述',
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '1775705344798',
    type: 'thoughtNode',
    data: {
      label: 'Hybrid方案',
      description: '结合多个框架优势互补',
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '1775705344731',
    type: 'thoughtNode',
    data: {
      label: '边缘渲染部署',
      description: 'Vercel/Cloudflare Workers加速首屏',
    },
    position: { x: 0, y: 0 },
  },
  {
    id: '1775705344771',
    type: 'thoughtNode',
    data: {
      label: 'AMP加速适配',
      description: 'Google AMP提高移动端收录速度',
    },
    position: { x: 0, y: 0 },
  },
];

const Edges: FrontEdge[] = [
  { id: '1775705345016-1775705344608', source: '1775705345016', target: '1775705344608', label: '使用Next.js框架构建', type: 'smoothstep' },
  { id: '1775705344608-1775705344648', source: '1775705344608', target: '1775705344648', label: '实现动态SSR', type: 'smoothstep' },
  { id: '1775705345016-1775705344577', source: '1775705345016', target: '1775705344577', label: '使用纯React框架构建', type: 'smoothstep' },
  { id: '1775705344577-1775705344947', source: '1775705344577', target: '1775705344947', label: '集成Prerender化', type: 'smoothstep' },
  { id: '1775705344577-1775705344722', source: '1775705344577', target: '1775705344722', label: '配置Meta标签', type: 'smoothstep' },
  { id: '1775705345016-1775705344798', source: '1775705345016', target: '1775705344798', label: '混合方案', type: 'smoothstep' },
  { id: '1775705344798-1775705344731', source: '1775705344798', target: '1775705344731', label: 'CDN+边缘计算', type: 'smoothstep' },
  { id: '1775705344798-1775705344771', source: '1775705344798', target: '1775705344771', label: 'AMP技术栈', type: 'smoothstep' },
];

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
        className="!h-3 !w-3 !border-2 !border-white !bg-sky-400"
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
        className="!h-3 !w-3 !border-2 !border-white !bg-indigo-400"
      />
    </div>
  );
}

function ThinkingMap({initialnodes,initialedges,isgraphing}:{initialnodes:FrontNode[];initialedges:FrontEdge[];isgraphing:boolean}) {
  const initialGraph = layoutGraph(Nodes, Edges);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);
  useLayoutEffect(() => {
    if (isgraphing) {
      const graph = layoutGraph(initialnodes, initialedges);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    } else {
      const graph = layoutGraph(Nodes, Edges);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    }
  }, [initialnodes, initialedges, isgraphing, setNodes, setEdges]);
  return (
    <div className="relative h-full overflow-hidden  border border-slate-300/60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.88),_rgba(240,245,255,0.78)_38%,_rgba(231,238,251,0.86)_100%)] p-4 md:p-8">
        {isgraphing ?   <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={{ thoughtNode: ThoughtNode }}
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
