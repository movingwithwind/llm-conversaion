import {create} from "zustand";
import type { nodeschemaType, edgeschemaType } from '../../api/schema';

type GraphStore = {
  nodes: nodeschemaType
  edges: edgeschemaType
  setNodes: (nodes: nodeschemaType) => void
  setEdges: (edges: edgeschemaType) => void
  clearGraph: () => void
}

export const graphStore = create<GraphStore>((set)=>({
    nodes:[] as nodeschemaType,
    edges:[] as edgeschemaType,
    setNodes:(nodes:nodeschemaType)=>set({nodes}),
    setEdges:(edges:edgeschemaType)=>set({edges}),
    clearGraph:()=>set({nodes:[],edges:[]})
}))