import { useState,useCallback } from 'react'
import {toast} from"sonner"
import { type GraphLayout,NodesBackToFront,EdgesBackToFront,type graphnodeschemaType, type graphedgeschemaType, type nodeschemaType, type edgeschemaType } from '../../stores/graph/graph.type'
import { graphStore } from '../../stores/graph/graph.store';
import { useGraphModelContext } from './graphmodel.provider';
import { mapAPi } from '../../api/map'
import { graphAPi } from '../../api/graph'

function useMapLogic() {
  const [question, setQuestion] = useState('')
  const [lastquestion, setLastQuestion] = useState('')
  const nodes = graphStore((state) => state.nodes)
  const edges = graphStore((state) => state.edges)
  const setNodes = graphStore((state) => state.setNodes)
  const setEdges = graphStore((state) => state.setEdges)
  const clearGraph = graphStore((state) => state.clearGraph)
  const [Layout, setLayout] = useState<GraphLayout>("Hierarchical layout")
  const [havinglayouted, setHavingLayouted] = useState(false);
  const [isGraphing, setIsGraphing] = useState(false);
  const [Maps, setMaps] = useState<{id: number, question: string}[]>([])
  const [activeMapId, setActiveMapId] = useState<number | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<nodeschemaType>([]);
  const { GraphModel, setGraphModel } = useGraphModelContext();

  const Forgraph=async (message:string)=>{
    try{
      setSelectedNodes([]);
      const data=await graphAPi.Post(message,GraphModel);
      const {nodes: Backnodes, edges: Backedges, layout}: {nodes:graphnodeschemaType,edges:graphedgeschemaType,layout:GraphLayout}=data.tool_results[0].output
      console.log('Back Nodes:', Backnodes);
      console.log('Back Edges:', Backedges);
      const Frontnodes:nodeschemaType=NodesBackToFront(Backnodes)
      const Frontedges:edgeschemaType=EdgesBackToFront(Backedges)
      setHavingLayouted(true);
      setNodes(Frontnodes);
      setLayout(layout);
      setEdges(Frontedges);
      setIsGraphing(true);
      console.log('Front Nodes:', Frontnodes);
      console.log('Front Edges:', Frontedges);
    }catch(error){
      console.error('Error fetching graph data:', error);
      toast.error('Failed to fetch graph data. Please try again later.');
    }
  }

  const UpdataNode=async(NodeId:string,label: string, description: string )=>{
    try{
      const data=await graphAPi.Put(NodeId,label,description);
      await GetGraph(activeMapId as number);
      toast.success(data.message);
    }
    catch(error){
      console.error('Error updating node data:', error);
      toast.error('Failed to update node data. Please try again later.');
    }
  }
 
  const handleSend = () => {
            setSelectedNodes([])
            setIsGraphing(false)
            setLastQuestion(question)
            setQuestion('')
            setActiveMapId(null);
            Forgraph(question)
            toast.success(`Question sent: ${question}`)
          }

  const GetMaps=useCallback(async()=>{
    try{
      const  data=await mapAPi.Get();
      setMaps(data.maps.reverse());
    } catch (error) {
      console.error('Error fetching graph data:', error);
      toast.error('Failed to fetch graph data. Please try again later.');
    }
  }, [])

  const GetGraph=useCallback(async(id:number)=>{
    try{
      const data=await graphAPi.Get(id);
      setSelectedNodes([]);
      const nodes =data.map.nodes.map((node) => ({
        ...node,
        message_count: node._count.message_links,
      }));
      setNodes(nodes);
      setEdges(data.map.edges);
      setLayout(data.map.layout);
      setActiveMapId(id);
      setHavingLayouted(false);
      setIsGraphing(true);
    } catch (error) {
      console.error('Error fetching graph data:', error);
      toast.error('Failed to fetch graph data. Please try again later.');
    }
  },[setNodes,setEdges])

  const DeleteMap=async(id:number)=>{
    try{
      setSelectedNodes([]);
      const data=await mapAPi.Delete(id);
      await GetMaps();
      if(activeMapId===id){
        clearGraph();
        setActiveMapId(null);
      }
      toast.success(data.message);
    } catch (error) {
      console.error('Error deleting map:', error);
      toast.error('Failed to delete map. Please try again later.');
    }
  }

  const PostMap=useCallback(async(nodes:nodeschemaType,edges:edgeschemaType,layout:GraphLayout)=>{
    try{
      const data = await mapAPi.Post(nodes, edges, lastquestion, layout);
      setActiveMapId(data.mapId);
      GetMaps();
      console.log(data);
      toast.success('Graph saved successfully!');
    }catch(error){
      console.error('Error saving graph data:', error);
      toast.error('Failed to save graph data. Please try again later.');
    }
  },[lastquestion, GetMaps])


 return {
    question,
    setQuestion,
    GraphModel,
    setGraphModel,
    lastquestion,
    handleSend,
    nodes,
    edges,
    Layout,
    setLayout,
    selectedNodes,
    setSelectedNodes,
    havinglayouted,
    isGraphing,
    Maps,
    activeMapId,
    GetMaps,
    GetGraph,
    UpdataNode,
    DeleteMap,
    PostMap
 }
}

export default useMapLogic;

