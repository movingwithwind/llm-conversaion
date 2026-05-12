//src\chat\chat.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import type { Response as ExpressResponse } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { FileService, ProcessedFile } from './file/file.service';
import { AiService } from './ai/ai.service';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

/** multipart 或 JSON 的 id 可能是字符串，message 为文本；文件走 @UploadedFile() */
type ChatBody = {
  id: string;
  node_ids: string;
  include_background_info:string;
  client_user_id: string;
  client_assistant_id: string;
  message: string;
  model:string;
};

type UpstreamUserContent =
  | { type: 'input_image'; image_url: string; detail: 'auto' | 'low' | 'high' }
  | { type: 'input_text'; text: string };

type UpstreamMessage =
  | { role: 'user'; content: UpstreamUserContent[] }
  | { role: 'system'; content: UpstreamUserContent[] }
  | { role: 'developer'; content: UpstreamUserContent[] };

type RegenerateBody = {
  message_id: number;
  role: 'user' | 'assistant';
  message?: string; // 仅 user 编辑时用
  model: string; // 可选，指定模型
};

@Controller('chat')
export class ChatController {
  constructor(
    private readonly fileService: FileService,
    private readonly aiService: AiService,
  ) {}

  private writeSseEvent(
    res: ExpressResponse,
    event: string,
    data: unknown,
  ): void {
    const payload =
      typeof data === 'string' ? data : JSON.stringify(data);
    res.write(`event: ${event}\ndata: ${payload}\n\n`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private  waitAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      const e = new Error('client aborted');
      e.name = 'AbortError';
      console.log('Request already aborted');
      return reject(e);
    }
    signal.addEventListener(
      'abort',
      () => {
        const e = new Error('client aborted');
        console.log('Request aborted by client');
        e.name = 'AbortError';
        reject(e);
      },
      { once: true },
    );
  });
}

  private buildUpstreamFromFiles(
    processedFiles: ProcessedFile[],
    question: string,
    nodeDetails: string,
    messageContext: string,
  ): { content: UpstreamMessage[] | undefined } {
    let combinedDetails = nodeDetails.trim();
    if (messageContext.trim()) {
      combinedDetails = messageContext.trim() + '\n\n' + combinedDetails;
    }

    const developerContent = combinedDetails.trim()
      ? [
          {
            role: 'developer' as const,
            content: [{ type: 'input_text' as const, text: combinedDetails }],
          },
        ]
      : [];
    if (processedFiles.length === 0) {
      return {
        content: [
          ...developerContent,
          { role: 'user', content: [{ type: 'input_text', text: question }] },
        ],
      };
    }

    const content: UpstreamMessage[] = [];
    const imageContents: UpstreamUserContent[] = [];

    for (const processed of processedFiles) {
      if (processed.type === 'image') {
        imageContents.push({
          type: 'input_image',
          image_url: `data:${processed.mime};base64,${processed.base64}`,
          detail: processed.detail,
        });
      } else {
        content.push({
          role: 'system',
          content: [{ type: 'input_text', text: processed.text }],
        });
      }
    }

    if (imageContents.length > 0) {
      content.push({
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'input_text',
            text: question,
          },
        ],
      });
    } else {
      content.push({
        role: 'user',
        content: [{ type: 'input_text', text: question }],
      });
    }
    content.unshift(...developerContent);
    return { content };
  }

  private async getnodedetails(nodeIds: string[], includeBackgroundInfo: boolean): Promise<string> {
    const nodes = await prisma.nodes.findMany({
      where: {
        id: { in: nodeIds },
      },
    });

    const Nodes=Array.isArray(nodes) ? nodes : [nodes];

    let details = '';
    if(includeBackgroundInfo){
      details += '这是一些背景信息的补充，下面是整图信息:\n';
      const allNodes = await prisma.nodes.findMany({
        where: {
          map_id: Nodes[0]?.map_id, 
        },
      });

      
        for (const node of allNodes) {
          const rawData =
          typeof node.data === 'string' ? node.data : JSON.stringify(node.data ?? {});
          const data = JSON.parse(rawData) as { label?: string; description?: string };
          details += `节点${data.label}信息为${data.description}\n`;
        }
    }
      details += '这是所选节点的详细信息:\n';
    //所选节点信息
    for (const node of Nodes) {
      const rawData =
        typeof node.data === 'string' ? node.data : JSON.stringify(node.data ?? {});
      const data = JSON.parse(rawData) as { label?: string; description?: string };
      if (!data.label || !data.description) {
        continue;
      }
      details += `已选节点${data.label}信息为${data.description}\n`;
    }
    return details;
  }


  private async getMessageContext(nodeIds: string[]): Promise<string> {
    const linkedMessages = await prisma.nodes_on_messages.findMany({
      where: {
        node_id: { in: nodeIds },
      },
      include: {
        message: true,
      },
      orderBy: {
        message: { created_at: 'asc' },
      },
    });

    if (linkedMessages.length === 0) {
      return '';
    }

    let contextText = '以下是相关的历史对话上下文信息:\n';
    for (const link of linkedMessages) {
      if (link.message && link.message.content) {
        contextText += `[${link.message.role}]: ${link.message.content}\n`;
      }
    }
    return contextText;
  }

  @Get()
  async getchat(@Query('ids') ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('ids 参数不能为空');
    }
    const list = Array.isArray(ids) ? ids : [ids];
    const messages = await prisma.messages.findMany({
      where: {
        node_links: {
          some: {
            node_id: { in: list } 
          }
        }
      },
      include: {
        node_links: {
          include: {
            node: true
          }
        }
      }
    });
    return { message: 'Messages fetched successfully', messages:messages };
  }

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async postchat(
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Req() req: { body: unknown },
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const body = req.body as ChatBody;
    const message = body?.message?.trim(); //去空格
    console.log("Received chat request:", { body, files });
    console.log("message:", message);
    const nodeIds = body?.node_ids.split(',').map((id) => id.trim()).filter((id) => id);
    const includeBackgroundInfo = parseInt(body?.include_background_info) === 1;
    const model = body?.model?.trim() || 'qwen3.5-flash';

    if (!message || !nodeIds || nodeIds.length === 0) {
      throw new BadRequestException('message 和 node_ids 都不能为空');
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8'); //开启SSE，保持连接
    res.setHeader('Cache-Control', 'no-cache, no-transform'); //禁止缓存和中间代理修改内容
    res.setHeader('Connection', 'keep-alive'); //保持连接
    res.setHeader('X-Accel-Buffering', 'no'); //禁止Nginx缓冲
    res.flushHeaders();

    this.writeSseEvent(res, 'parsing_input', '正在理解用户问题中');
    await this.delay(500);

    const nodeDetails = await this.getnodedetails(nodeIds, includeBackgroundInfo);
    const messageContext = await this.getMessageContext(nodeIds);

    const uploadedFiles = files ?? [];
    const processedFiles = await this.fileService.processFiles(uploadedFiles);

    const { content } =  this.buildUpstreamFromFiles(processedFiles, message, nodeDetails, messageContext);
    this.writeSseEvent(res, 'fetching_context', '获取背景及上下文信息中');
    await this.delay(500);

    console.log('Processed files and built upstream content:', { content });
    this.writeSseEvent(res, 'reasoning', '思考中');

    const abortController = new AbortController();
    res.on('close', () => {
      abortController.abort();
      if (!res.writableEnded) {
        res.end();
      }
    }); //客户端断开连接时中止请求并结束响应
    let upstream: globalThis.Response;
    try{
      upstream = await Promise.race<globalThis.Response>([
        this.aiService.getAIresponse(content, abortController,model),
        this.waitAbort(abortController.signal),
      ]) ;
    }catch(e){
      if (e instanceof Error && e.name === 'AbortError') {
        console.log('Request aborted by client');
        return;
      }
      throw e;
    }

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text();
      throw new HttpException(
        `调用 OpenAI 接口失败: ${errText}`,
        upstream.status,
      );
    }

    const reader = upstream.body.getReader(); //读取流
    const decoder = new TextDecoder(); //解码二进制
    let buffer = '';

    this.writeSseEvent(res, 'meta', { question: message });

    let answer = '';
    let finished = false;

    const finishPostChat = async () => {
      if (finished || (abortController.signal.aborted&&answer.trim() === '')) {
        return;
      }
      finished = true;

      console.log('AI response completed. Final answer:', answer);
      //将完整问答存入数据库
      const userMessage = await prisma.messages.create({
        data: {
          role: 'user',
          content: message,
          created_at: new Date(),
        },
      });

      const assistantMessage = await prisma.messages.create({
        data: {
          role: 'assistant',
          content: answer,
          parent_id: userMessage.id,
          created_at: new Date(),
        },
      });
      //关联节点消息
      await prisma.nodes_on_messages.createMany({
        data: [
          ...nodeIds.map((nodeId) => ({
            node_id: nodeId,
            message_id: userMessage.id,
          })),
          ...nodeIds.map((nodeId) => ({
            node_id: nodeId,
            message_id: assistantMessage.id,
          })),
        ],
      });

      // 将上传文件信息写入 file 表（关联到用户消息）
      for (const processed of processedFiles) {
        await prisma.file.create({
          data: {
            url: processed.url,
            type: processed.type,
            size: processed.size,
            message_id: userMessage.id,
          },
        });
      }

      if (!res.writableEnded) {
        res.write(`
            event: done\ndata:${JSON.stringify({ userid: userMessage.id, assistantid: assistantMessage.id, client_user_id: body.client_user_id, client_assistant_id: body.client_assistant_id, user_parent_id: userMessage.parent_id, assistant_parent_id: assistantMessage.parent_id })}\n\n`);
        res.end();
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read(); //value二进制
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true }); //解码二进制数据
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; //避免半包问题

        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data:')) {
            continue;
          }

          const payload = line.slice(5).trim();
          if (!payload) {
            continue;
          }

          try {
            const parsed = payload === '[DONE]'
              ? undefined
              : (JSON.parse(payload) as {
                  type?: string;
                  delta?: string;
                });

            if (
              payload === '[DONE]' ||
              parsed?.type === 'response.completed' ||
              parsed?.type === 'response.output_text.done' ||
              parsed?.type === 'output_text.done' ||
              abortController.signal.aborted
            ) {
              await finishPostChat();
              return;
            }

            const chunk =
              parsed?.type === 'response.output_text.delta' ||
              parsed?.type === 'output_text.delta'||
              parsed?.type === 'response.content_part.delta'
                ? parsed?.delta
                : undefined;
            if (chunk) {
              answer += chunk;
              this.writeSseEvent(res, 'answer', { answer: chunk });
            }
          } catch {
            continue;
          }
        }
      }
    } finally {
      // 即使连接被中断，只要已经拿到有效回答，也兜底落库。
      if (!finished && answer.trim() !== '') {
        await finishPostChat();
      }
    }

    if (!finished && !res.writableEnded) {
      await finishPostChat();
    } //兜底结束
  }

  @Put()
  async updatechat(@Req() req: { body: RegenerateBody }, @Res() res: ExpressResponse) {
    const {  message_id, role, message, model } = req.body;
    if (  !message_id || !role) {
      throw new BadRequestException('参数错误');
    }

    // 1. 查找目标消息并校验 node_id / role
    const target = await prisma.messages.findUnique({
      where: { id: message_id },
    });
    if (!target  || target.role !== role) {
      throw new BadRequestException('消息不存在或参数不匹配');
    }

    // 先返回状态，前端可立即感知请求已被接受。
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    this.writeSseEvent(res, 'parsing_input', '正在理解用户问题中');
    await this.delay(500);

    let userMessage = target;
    const assistantMessage =
      role === 'assistant'
        ? target
        : await prisma.messages.findFirst({
            where: {
              parent_id: message_id,
              role: 'assistant',
            },
          });

    // 2. 如果是 user 消息：要求 parent_id 为 null，并更新 user 的内容
    if (role === 'user') {
      if (target.parent_id !== null) {
        throw new BadRequestException('只能对顶层 user 消息重新生成');
      }
      if (!message) {
        throw new BadRequestException('用户消息内容不能为空');
      }

      // 更新 user 消息内容
      userMessage = await prisma.messages.update({
        where: { id: message_id },
        data: { content: message },
      });
    } else {
      // role === 'assistant' 时，找到对应的 user 作为 parent
      if (!target.parent_id) {
        throw new BadRequestException('assistant 消息缺少 parent_id');
      }
      const parentUser = await prisma.messages.findFirst({
        where: { id: target.parent_id, role: 'user' },
      });
      if (!parentUser) {
        throw new BadRequestException('找不到对应的 user 消息');
      }
      userMessage = parentUser;
    }

    // 3. 查找该 user 消息关联的文件，并读取已处理结果（如果有）
    const files = await prisma.file.findMany({
      where: { message_id: userMessage.id },
      orderBy: { created_at: 'asc' },
    });

    const question = role === 'user' && message ? message : userMessage.content;
    const processedFiles = this.fileService.getProcessedByUrls(
      files.map((f) => f.url),
    );
    const linkedNodes = await prisma.nodes_on_messages.findMany({
      where: { message_id: userMessage.id },
      select: { node_id: true },
    });
    const nodeDetails = await this.getnodedetails(
      linkedNodes.map((item) => item.node_id),
      true,
    );
    const messageContext = await this.getMessageContext(
      linkedNodes.map((item) => item.node_id),
    );
    this.writeSseEvent(res, 'fetching_context', '获取背景信息中');
    
    const { content } = this.buildUpstreamFromFiles(
      processedFiles,
      question,
      nodeDetails,
      messageContext,
    );
    res.write('event: fetching_context\ndata: 获取背景信息中\n\n');
    await this.delay(500);


    console.log('Built upstream content from files:', content );
    this.writeSseEvent(res, 'reasoning', '思考中');

    const abortController = new AbortController();
    res.on('close', () => {
      abortController.abort();
      if (!res.writableEnded) {
        res.end();
      }
    }); // 客户端断开连接时中止请求并结束响应

    let upstream: globalThis.Response;
    try{
      upstream = await Promise.race<globalThis.Response>([
        this.aiService.getAIresponse(content, abortController, model),
        this.waitAbort(abortController.signal),
      ]) ;
    }catch(e){
      if (e instanceof Error && e.name === 'AbortError') {
        console.log('Request aborted by client');
        return;
      }
      throw e;
    }

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text();
      throw new HttpException(
        `调用 OpenAI 接口失败: ${errText}`,
        upstream.status,
      );
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';
    let finished = false;

    const finishUpdateChat = async () => {
      if (finished || (abortController.signal.aborted&&answer.trim() === '')) {
        return;
      }
      finished = true;

      console.log('AI response completed. Final answer:', answer);

      // 5. 在完成时更新 / 创建 assistant 消息
      if (!assistantMessage || assistantMessage.role !== 'assistant') {
        await prisma.messages.create({
          data: {
            role: 'assistant',
            content: answer,
            parent_id: userMessage.id,
            created_at: new Date(),
          },
        });
      } else {
        await prisma.messages.update({
          where: { id: assistantMessage.id },
          data: { content: answer },
        });
      }

      if (!res.writableEnded) {
        res.write('event: done\ndata: [DONE]\n\n');
        res.end();
      }
    };

    this.writeSseEvent(res, 'meta', { question });

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data:')) {
            continue;
          }

          const payload = line.slice(5).trim();
          if (!payload) {
            continue;
          }

          try {
            const parsed = payload === '[DONE]'
              ? undefined
              : (JSON.parse(payload) as {
                  type?: string;
                  delta?: string;
                });

            if (
              payload === '[DONE]' ||
              parsed?.type === 'response.completed' ||
              parsed?.type === 'response.output_text.done' ||
              parsed?.type === 'output_text.done' ||
              abortController.signal.aborted
            ) {
              await finishUpdateChat();
              return;
            }

            const chunk =
              parsed?.type === 'response.output_text.delta' ||
              parsed?.type === 'output_text.delta'||
              parsed?.type === 'response.content_part.delta'
                ? parsed?.delta
                : undefined;
            if (chunk) {
              answer += chunk;
              this.writeSseEvent(res, 'answer', { answer: chunk });
            }
          } catch {
            continue;
          }
        }
      }
    } finally {
      // 中断后若已有有效回答，兜底更新/写入 assistant 消息。
      if (!finished && answer.trim() !== '') {
        await finishUpdateChat();
      }
    }

    if (!finished && !res.writableEnded) {
      await finishUpdateChat();
    }
  }
}
