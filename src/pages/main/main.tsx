import { useState } from 'react'
import PromptComposer from './PromptComposer'
import QuestionSidebar from './QuestionSidebar'
// import ThinkingMap from './ThinkingMap'
import {toast} from"sonner"
import Evocation from '../conversation/evocation'

function Conversation() {
  const [question, setQuestion] = useState('')
  const [lastquestion, setLastQuestion] = useState('')
  const[isconversationStarted,setIsConversationStarted]=useState(false)
  return (
    <div className="flex min-h-screen bg-[linear-gradient(160deg,#d7deee_0%,#e8edf8_35%,#dae2f3_100%)] ">
      <main className="mx-auto flex w-full flex-1 flex-col overflow-hidden shadow-2xl">

        <section className="flex min-h-[620px] flex-1 flex-col lg:flex-row">
          <QuestionSidebar question={lastquestion}/>

          <div className="min-w-0 flex-1 border-y border-slate-200 bg-white/70 lg:border-x lg:border-y-0 relative">
            <button
              className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setIsConversationStarted(true)}
            >
              Start Conversation
            </button> 
            {/* <ThinkingMap question={question} /> */}
            {isconversationStarted && (
              <div className='absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center'>
                <Evocation className="  bg-white text-black p-4 w-4/5 h-4/5 rounded-2xl shadow-xl p-6 border-none" onClose={() => setIsConversationStarted(false)} />
              </div>
            )}
          </div>

        </section>

        <PromptComposer
          question={question}
          onQuestionChange={setQuestion}
          onSend={() => {
            setLastQuestion(question)
            setQuestion('')
            toast.success(`Question sent: ${question}`)
          }}
        />
      </main>
    </div>
  )
}

export default Conversation
