
import { Link, Route, Routes } from 'react-router-dom'
import Main from './pages/main/main'
import RagLayout from './pages/rag/RagLayout'
import KBList from './pages/rag/KBList'
import KBDetail from './pages/rag/KBDetail'

function Home() {

  return (
    <>
      <section
        id="welcome"
        className="mx-auto mt-8 w-full max-w-3xl rounded-2xl border border-blue-200/80 bg-blue-100/80 px-6 py-8 text-left shadow-sm backdrop-blur-sm"
      >
        <h1 className="!m-0 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
          Welcome to Vite + React!
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">
          This is a simple React app that demonstrates the power of Vite's
          development server and build tool. It includes features like hot module
          replacement (HMR) and fast refresh, which allow you to see your changes
          in real time without losing state.
        </p>
        <Link
          to="/main"
          className="mt-6 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Go to Conversation
        </Link>
      </section>
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/main" element={<Main />} />
      <Route path="/rag" element={<RagLayout />}>
        <Route index element={<KBList />} />
        <Route path="knowledge-bases/:id" element={<KBDetail />} />
      </Route>
    </Routes>
  )
}

export default App
