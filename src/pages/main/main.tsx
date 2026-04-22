import { useState,useEffect,useCallback } from 'react'
import PromptComposer from './PromptComposer'
import QuestionSidebar from './QuestionSidebar'
import ThinkingMap from './ThinkingMap'
import {toast} from"sonner"
import Evocation from '../conversation/evocation'
import { type BackEdge,type BackNode,type FrontEdge,type FrontNode,type GraphLayout,type Map,NodesBackToFront,EdgesBackToFront } from './data'

function Conversation() {
  const [question, setQuestion] = useState('')
  const [lastquestion, setLastQuestion] = useState('')
  const[isconversationStarted,setIsConversationStarted]=useState(false)
  const [nodes, setNodes] = useState<FrontNode[]>([]);
  const [edges, setEdges] = useState<FrontEdge[]>([]);
  const [Layout, setLayout] = useState<GraphLayout>("Hierarchical layout")
  const [havinglayouted, setHavingLayouted] = useState(false);
  const [isGraphing, setIsGraphing] = useState(false);
  const [Maps, setMaps] = useState<Map[]>([])
  const [activeMapId, setActiveMapId] = useState<number | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<FrontNode[]>([]);

  const Forgraph=async (message:string)=>{
    try{
      setSelectedNodes([]);
      const response = await fetch('/api/graph', {
        method: 'POST',
        headers: {  'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message }),
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const data = await response.json();
      const {nodes: Backnodes, edges: Backedges, layout}: {nodes:BackNode[],edges:BackEdge[],layout:GraphLayout}=data.tool_results[0].output
      console.log('Back Nodes:', Backnodes);
      console.log('Back Edges:', Backedges);
      const Frontnodes:FrontNode[]=NodesBackToFront(Backnodes)
      const Frontedges:FrontEdge[]=EdgesBackToFront(Backedges)
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
 
  const handleSend = () => {
            setSelectedNodes([])
            setIsGraphing(false)
            setLastQuestion(question)
            setQuestion('')
            setActiveMapId(null);
            Forgraph(question)
            toast.success(`Question sent: ${question}`)
          }

  const GetMaps=async()=>{
    try{
      const response = await fetch('/api/map')
      if (!response.ok) {        throw new Error(`Server error: ${response.statusText}`);
      }
      const data:{ maps: Map[] } = await response.json();
      setMaps(data.maps.reverse());
    } catch (error) {
      console.error('Error fetching graph data:', error);
      toast.error('Failed to fetch graph data. Please try again later.');
    }
  }

  const GetGraph=async(id:number)=>{
    try{
      setSelectedNodes([]);
      const response = await fetch(`/api/graph/?id=${id}`)
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const data = await response.json();
      const nodes =data.map.nodes.map((node:BackNode) => ({
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
  }

  const DeleteMap=async(id:number)=>{
    try{
      setSelectedNodes([]);
      const response = await fetch(`/api/map/?id=${id}`,{
        method:'DELETE'
      })
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const data=await response.json();
      await GetMaps();
      if(activeMapId===id){
        setNodes([]);
        setEdges([]);
        setActiveMapId(null);
      }
      toast.success(data.message);
    } catch (error) {
      console.error('Error deleting map:', error);
      toast.error('Failed to delete map. Please try again later.');
    }
  }

  const PostMap=useCallback(async(nodes:FrontNode[],edges:FrontEdge[],layout:GraphLayout)=>{
    try{
      const response = await fetch('/api/map', {
        method: 'POST',
        headers: {  'Content-Type': 'application/json' },
        body: JSON.stringify({ question: lastquestion, nodes, edges, layout }),
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const data = await response.json();
      setActiveMapId(data.mapId);
      GetMaps();
      console.log(data);
      toast.success('Graph saved successfully!');
    }catch(error){
      console.error('Error saving graph data:', error);
      toast.error('Failed to save graph data. Please try again later.');
    }
  },[lastquestion])


  useEffect(() => {
    GetMaps()
  }, [])

  return (
    <div className="flex min-h-screen bg-[linear-gradient(160deg,#d7deee_0%,#e8edf8_35%,#dae2f3_100%)] ">
      <main className="mx-auto flex w-full flex-1 flex-col overflow-hidden shadow-2xl">

        <section className="flex min-h-[620px] flex-1 flex-col lg:flex-row">
          <QuestionSidebar question={lastquestion} Maps={Maps} GetGraph={GetGraph} avtivemapId={activeMapId} DeleteMap={DeleteMap} selectedNodes={selectedNodes} setSelectedNodes={setSelectedNodes} startConversation={() => setIsConversationStarted(true)} />

          <div className="min-w-0 flex-1 border-y border-slate-200 bg-white/70 lg:border-x lg:border-y-0 relative">
            <ThinkingMap initialnodes={nodes} initialedges={edges} isgraphing={isGraphing} Layout={Layout} havinglayouted={havinglayouted} PostMap={PostMap} selectedNodes={selectedNodes} setSelectedNodes={setSelectedNodes}  />
            {isconversationStarted && (
              <div className='absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center'>
                <Evocation className="  bg-white text-black p-4 w-4/5 h-4/5 rounded-2xl shadow-xl p-6 border-none" onClose={() => setIsConversationStarted(false)} selectedNodes={selectedNodes} />
              </div> 
            )}
          </div>

        </section>

        <PromptComposer
          question={question}
          onQuestionChange={setQuestion}
          onSend={handleSend}
        />
      </main>
    </div>
  )
}

export default Conversation
