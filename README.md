
## 项目概述

`LLM Conversation` 是一个面向 AI 对话与智能图谱分析的全栈应用，前端负责对话工作台、长消息渲染和图谱交互，后端负责文件解析、知识节点管理、图谱生成、SSE 流式响应和数据持久化。整体交互流程是：用户发起问题 -> 后端生成图谱或基于节点内容回答 -> 前端实时流式展示 -> 用户在图谱侧选择节点继续追问或回溯历史图谱。

## 技术栈

**前端：** React 19、TypeScript、Vite、Tailwind CSS、React Router、React Flow、Dagre、react-virtuoso、react-markdown、rehype-highlight、remark-gfm、eventsource-parser、ReadableStream、AbortController / AbortSignal、sonner、lucide-react、zod

**后端：** NestJS、TypeScript、Prisma、PostgreSQL、OpenAI SDK、SSE、Ajv、Winston、AbortController、pdf-parse、mammoth、xlsx、cheerio、multer

## 项目亮点

- SSE 流式推送与随帧更新：后端基于 OpenAI SDK + SSE 输出增量内容，前端通过 `ReadableStream` 读取上游 SSE，再用 `eventsource-parser` 解析事件并结合 `requestAnimationFrame` 逐帧刷新，减少高频渲染卡顿，支持“思考中 / 获取上下文中”等阶段态展示。
- 请求中断与流式收束：前端通过 `AbortController` 终止当前请求，并配合 `ReadableStreamDefaultReader.cancel()` 主动关闭流读取，避免切换问题、重试或重新提问时出现旧流串入。
- 长对话虚拟列表渲染：消息列表使用 `react-virtuoso`，配合自动滚动、复制、编辑、重试等交互，保证长上下文场景下的性能与可用性。
- Markdown 安全渲染与代码高亮：助手回复通过 `react-markdown` + `remark-gfm` + `rehype-highlight` 渲染，代码块支持一键复制，提升长文本和代码内容的可读性。
- 图谱式知识组织与编辑：前端基于 `React Flow + Dagre` 构建可视化知识图谱，支持层级 / 径向布局、节点选择、节点编辑、消息数提示和历史图谱回溯。
- 多模态文档解析：后端统一处理 PDF、Word、Excel、HTML、文本和图片文件，自动完成提取、清洗与结构化组装，为文件问答和上下文补充提供基础能力。
- 图谱生成与校验闭环：后端通过系统提示词 + Function Calling 驱动图谱生成，并用 `Ajv` 严格校验 LLM 输出，配合重试纠错保证结果稳定。

## 启动教学

### 1️⃣ 首次安装依赖

```bash
cd llm-conversation
npm install
# 或使用 pnpm（推荐，更快）
pnpm install
```

### 2️⃣ 配置数据库与环境变量

编辑 `backend/.env.local` 与 `backend/.env`：

```env
# backend/.env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/llm_conversation"

# backend/.env.local
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=你的_api_key
OPENAI_MODEL=默认模型
OPENAI_BASE_URL=https://api.openai.com/v1
```

**需要修改的内容：**
- `用户名` 和 `密码`：PostgreSQL 数据库凭证
- `OPENAI_API_KEY`：你的 OpenAI API 密钥
- `OPENAI_BASE_URL`：如使用兼容 OpenAI 的第三方服务，可改成对应地址

### 3️⃣ 运行数据库迁移

```bash
cd backend
npx prisma migrate deploy
# 或使用 pnpm
pnpm exec prisma migrate deploy
```
> 后端的 `build` 和 `start:dev` 已配置为在启动前自动执行 `prisma generate`，一般不需要手动额外执行。

### 4️⃣ 启动开发环境

```bash
# 在根目录执行，同时启动前后端
npm run dev

# 或分别启动：
npm run dev:frontend  # 前端 - http://localhost:5173
npm run dev:backend   # 后端 - http://localhost:3000
```

### 5️⃣ 构建与生产模式启动

下面是将项目构建为可发布产物并在本地以生产方式启动的步骤（保留开发模式不变）。

- 在根目录构建前后端：

```bash
npm run build
```

- 启动后端（生产模式，使用已构建的 `dist/`）：

```bash
cd backend
# 安装依赖（如尚未安装）
npm install --production
# 构建后运行生产启动脚本
npm run start:prod
```

- 本地预览前端构建（可选）：

```bash
cd frontend
npm install --production
npm run preview
# 按终端输出访问预览地址（通常为 http://localhost:5173）
```

说明：
- `npm run build` 会先构建后端（生成 `backend/dist/`），再构建前端静态文件。
- `npm run start:prod` 依赖已存在的 `backend/dist/`，因此必须先运行 `npm run build`。
- 生产环境请确保 `backend/.env.local`（或环境变量）中包含正确的数据库与 API Key 配置，并已运行数据库迁移。


## API 代理配置

前端通过 Vite 代理自动转发 API 请求到后端：
- 前端请求：`http://localhost:5173/api/endpoint`
- 实际后端：`http://localhost:3000/endpoint`
- 代理配置：`frontend/vite.config.ts`

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装前后端全部依赖 |
| `npm run dev` | 同时运行前后端 |
| `npm run dev:frontend` | 仅运行前端 |
| `npm run dev:backend` | 仅运行后端 |
| `npm run build` | 构建前后端 |
| `npm run lint` | 代码检查 |
| `npm run test` | 运行后端测试 |

## 项目结构

```text
llm-conversation/
├── frontend/              ← React 前端
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── backend/               ← NestJS 后端
│   ├── src/
│   ├── package.json
│   ├── prisma/
│   ├── .env.local         ← 需要配置
│   └── ...
├── package.json           ← Monorepo 根配置
└── README.md
```

## 注意事项

1. 数据库必须先配置好，否则后端无法启动。
2. `backend/.env.local` 才是实际运行环境配置，根目录 `.env` 仅作为模板参考。
3. 确保 3000 和 5173 端口未被占用。
4. 首次启动时先完成依赖安装和数据库迁移。

## 常见问题

**Q: 运行 `npm run dev` 报错？**
A: 先检查是否已执行 `npm install`，并确认 `backend/.env.local` 和数据库配置正确。

**Q: 前端无法连接后端？**
A: 检查后端是否已启动在 3000 端口，并确认 `frontend/vite.config.ts` 的代理配置有效。

**Q: 数据库连接失败？**
A: 修改 `backend/.env` 中的 `DATABASE_URL`，确认 PostgreSQL 正常运行。

---


