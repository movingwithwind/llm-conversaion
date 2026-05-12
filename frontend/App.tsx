
import { Link, Route, Routes } from 'react-router-dom'
import Main from './pages/main/main'

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="text-center">
          <div className="mb-6 inline-block">
            <span className="rounded-full bg-slate-200/60 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur-sm">
              🚀 AI对话 + 知识图谱工作台
            </span>
          </div>
          
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            LLM <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Conversation</span>
          </h1>
          
          <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-600">
            智能对话与可视化知识图谱的完美融合。通过流式AI生成、虚拟列表优化和交互式图表编辑，
            打造高效的大模型对话体验。
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/main"
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-center font-semibold text-white shadow-lg transition hover:shadow-xl hover:from-blue-700 hover:to-blue-800"
            >
              开始对话 →
            </Link>
            <a
              href="https://github.com/movingwithwind/llm-conversaion"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 bg-white/70 px-8 py-3 text-center font-semibold text-slate-700 backdrop-blur-sm transition hover:bg-white/90"
            >
              查看文档
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-center text-3xl font-bold text-slate-900 sm:text-4xl">
          核心功能
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-slate-600">
          集成最新的AI技术和前端优化方案
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="group rounded-xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-sm transition hover:border-slate-300/80 hover:bg-white/80 hover:shadow-lg">
            <div className="mb-4 inline-block rounded-lg bg-slate-100/60 p-3">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">流式响应</h3>
            <p className="text-sm text-slate-600">
              基于SSE的流式数据推送，实时展示AI生成过程，提升用户体验。
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group rounded-xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-sm transition hover:border-slate-300/80 hover:bg-white/80 hover:shadow-lg">
            <div className="mb-4 inline-block rounded-lg bg-slate-100/60 p-3">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">知识图谱</h3>
            <p className="text-sm text-slate-600">
              可交互的DAG图表编辑器，支持层级和径向双布局，直观展示思维逻辑。
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group rounded-xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-sm transition hover:border-slate-300/80 hover:bg-white/80 hover:shadow-lg">
            <div className="mb-4 inline-block rounded-lg bg-slate-100/60 p-3">
              <span className="text-2xl">📁</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">多格式解析</h3>
            <p className="text-sm text-slate-600">
              支持PDF、DOCX、Excel、HTML等多种文件格式，智能提取和处理。
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group rounded-xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-sm transition hover:border-slate-300/80 hover:bg-white/80 hover:shadow-lg">
            <div className="mb-4 inline-block rounded-lg bg-slate-100/60 p-3">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">性能优化</h3>
            <p className="text-sm text-slate-600">
              虚拟列表渲染长对话，requestAnimationFrame批处理，毫秒级响应。
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group rounded-xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-sm transition hover:border-slate-300/80 hover:bg-white/80 hover:shadow-lg">
            <div className="mb-4 inline-block rounded-lg bg-slate-100/60 p-3">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">模型灵活选择</h3>
            <p className="text-sm text-slate-600">
              无缝直接切换模型，支持结构化输出和Schema验证。
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group rounded-xl border border-slate-200/60 bg-white/60 p-6 backdrop-blur-sm transition hover:border-slate-300/80 hover:bg-white/80 hover:shadow-lg">
            <div className="mb-4 inline-block rounded-lg bg-slate-100/60 p-3">
              <span className="text-2xl">💾</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">会话持久化</h3>
            <p className="text-sm text-slate-600">
              PostgreSQL+Prisma确保对话历史和图谱数据安全存储。
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-16 text-center text-white shadow-lg">
          <h2 className="mb-4 text-3xl font-bold text-white">准备好开始了吗？</h2>
          <p className="mb-8 text-lg opacity-90">
            立即进入对话界面，体验AI与知识图谱的完美融合。
          </p>
          <Link
            to="/main"
            className="inline-block rounded-lg bg-white/20 px-8 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            进入应用 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/40 bg-white/40 py-8 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-600 sm:px-6 lg:px-8">
          <p>LLM Conversation Platform • 智能对话 × 知识图谱</p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/main" element={<Main />} />
    </Routes>
  )
}

export default App
