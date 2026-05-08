import { useState,useEffect} from 'react'
import PromptComposer from './PromptComposer'
import QuestionSidebar from './QuestionSidebar'
import ThinkingMap from './ThinkingMap'
import Evocation from '../conversation/evocation'
import useMapLogic from './usemaplogic'

function Conversation() {

  const[isconversationStarted,setIsConversationStarted]=useState(false)

  const {
    question,
    setQuestion,
    lastquestion,
    handleSend,
    nodes,
    edges,
    Layout,
    selectedNodes,
    setSelectedNodes,
    havinglayouted,
    isGraphing,
    Maps,
    activeMapId,
    GetMaps,
    UpdataNode,
    GetGraph,
    DeleteMap,
    PostMap
  } = useMapLogic();


  useEffect(() => {
    GetMaps()
  }, [GetMaps])

  useEffect(() => {
    if (!isconversationStarted&&activeMapId) GetGraph(activeMapId)
  }, [isconversationStarted,activeMapId,GetGraph])

  return (
    <div className="flex min-h-screen bg-[linear-gradient(160deg,#d7deee_0%,#e8edf8_35%,#dae2f3_100%)] ">
      <main className="mx-auto flex w-full flex-1 flex-col overflow-hidden shadow-2xl">

        <section className="flex min-h-[620px] flex-1 flex-col lg:flex-row">
          <QuestionSidebar question={lastquestion} Maps={Maps} GetGraph={GetGraph} avtivemapId={activeMapId} DeleteMap={DeleteMap} selectedNodes={selectedNodes}  startConversation={() => setIsConversationStarted(true)} />

          <div className="min-w-0 flex-1 border-y border-slate-200 bg-white/70 lg:border-x lg:border-y-0 relative">
            <ThinkingMap initialnodes={nodes} initialedges={edges} isgraphing={isGraphing} Layout={Layout} havinglayouted={havinglayouted} PostMap={PostMap} selectedNodes={selectedNodes} setSelectedNodes={setSelectedNodes}  UpdataNode={UpdataNode}/>
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
