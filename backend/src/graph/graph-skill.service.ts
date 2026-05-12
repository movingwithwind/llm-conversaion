import { BadRequestException, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import { systemprompt } from '../model';
import { generateGraphTool } from './graph.skill';
import { GenerateGraphService } from './generate_graph/generate_graph.service';

type GraphInput = {
  title: string;
  description: string;
  children: {
    condition: string;
    node: GraphInput;
  }[];
};

type Node = {
  id: number;
  title: string;
  description: string;
};

type Edge = {
  from: number;
  to: number;
  condition: string;
};

type GraphOutput = {
  nodes: Node[];
  edges: Edge[];
};

type ToolResult = {
  function_name: string;
  output: GraphOutput;
};

type GraphLayout = "Radial layout" | "Hierarchical layout";

const graphValidationSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    children: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          condition: { type: 'string', minLength: 1 },
          node: { $ref: '#' },
        },
        required: ['condition', 'node'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'description', 'children'],
  additionalProperties: false,
};

@Injectable()
export class GraphSkillService {
  private readonly ajv: Ajv;
  private readonly validateGraphInput: ValidateFunction<GraphInput>;
  private readonly openai: OpenAI;
  private readonly tools = [generateGraphTool];

  constructor(private readonly generateGraphService: GenerateGraphService) {
    this.ajv = new Ajv({ allErrors: true });
    this.validateGraphInput = this.ajv.compile(graphValidationSchema);
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL?.trim(),
    });
  }

  async executeSkill(question: string, model: string): Promise<{ user_message: string; tool_results: ToolResult[] }> {
    const Input: OpenAI.Responses.ResponseInput = [
      {
        role: "system",
        content: [{ type: "input_text", text: systemprompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: question }],
      },
    ];

    const toolResults: ToolResult[] = [];
    const maxAttempts = 5;
    let lastErrorMessage = '';
    const errorMessages: string[] = [];
    let response: OpenAI.Responses.Response | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      if (lastErrorMessage.length > 0) errorMessages.push(lastErrorMessage);
      response = await this.openai.responses.create({
        model: model || process.env.OPENAI_MODEL?.trim() || 'qwen3.5-flash',
        tools: this.tools,
        temperature: 0.2, // 降低温度参数，提升工具调用输出的稳定性
        tool_choice: "auto",
        input: this.buildRetryInput(Input, attempt, errorMessages),
      });

      console.log('助手消息:', JSON.stringify(response));

      const functionCalls = response.output.filter(
        (item) => item.type === "function_call"
      );

      if (functionCalls.length !== 1) {
        lastErrorMessage = `LLM 必须且只能调用 1 次 generate_graph，当前调用数: ${functionCalls.length}`;
        if (attempt === maxAttempts) throw new BadRequestException(lastErrorMessage);
        continue;
      }

      const call = functionCalls[0];
      if (call.name !== 'generate_graph') {
        lastErrorMessage = `仅允许调用 generate_graph，当前为: ${call.name}`;
        if (attempt === maxAttempts) throw new BadRequestException(lastErrorMessage);
        continue;
      }

      try {
        const args = this.parseToolArguments(call.arguments);
        console.log('调用 generate_graph，原始参数:', JSON.stringify(args));

        const graphInput = this.normalizeGraphInput(args.graph);
        const output = this.generateGraphService.generateGraph(graphInput, args.layout as GraphLayout);
        
        toolResults.push({ function_name: call.name, output });

        console.log('工具调用名称:', call.name);
        console.log('工具调用参数:', JSON.stringify(args));
        console.log('工具输出结果:', JSON.stringify(output));
        break;
      } catch (error) {
        lastErrorMessage = this.extractErrorMessage(error); // 转化为字符串类型错误，方便后续 LLM 读取处理
        if (attempt === maxAttempts) throw new BadRequestException(lastErrorMessage);
      }
    }

    if (!response || toolResults.length === 0) {
      throw new BadRequestException(lastErrorMessage || 'generate_graph 调用失败');
    }

    return {
      user_message: question,
      tool_results: toolResults,
    };
  }

  private parseToolArguments(raw: string): Record<string, unknown> {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        throw new BadRequestException('工具参数必须是 JSON 对象');
      }
      return parsed as Record<string, unknown>;
    } catch {
      throw new BadRequestException('工具参数不是合法的 JSON');
    }
  }

  private buildRetryInput(
    baseInput: OpenAI.Responses.ResponseInput,
    attempt: number,
    errorMessages: string[],
  ): OpenAI.Responses.ResponseInput {
    if (attempt <= 1) return baseInput;

    const retryMessages: OpenAI.Responses.ResponseInput = errorMessages.map((msg) => ({
      role: 'system',
      content: [
        {
          type: 'input_text',
          text: `上一次 generate_graph 调用失败，原因：${msg}。请严格按 schema 重新调用一次 generate_graph：graph 必须是对象，字段只能为 title、description、children，children 每项只能为 condition 和 node。`,
        },
      ],
    }));

    return [...baseInput, ...retryMessages];
  }

  private normalizeGraphInput(rawGraph: unknown): GraphInput {
    const parsed = this.parseMaybeJson(rawGraph, 'graph');
    if (!this.validateGraphInput(parsed)) {
      throw new BadRequestException(this.formatAjvErrors(this.validateGraphInput.errors));
    }
    return this.normalizeGraphNode(parsed);
  }

  private parseMaybeJson(value: unknown, fieldName: string): unknown {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException(`${fieldName} 参数不是合法的 JSON`);
    }
  }

  private normalizeGraphNode(node: GraphInput): GraphInput {
    return {
      title: node.title.trim(),
      description: node.description.trim(),
      children: node.children.map((child) => ({
        condition: child.condition.trim(),
        node: this.normalizeGraphNode(child.node),
      })),
    };
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof BadRequestException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (response && typeof response === 'object' && 'message' in response) {
        const message = (response as { message?: unknown }).message;
        if (Array.isArray(message)) return message.join('; ');
        if (typeof message === 'string') return message;
      }
      return error.message;
    }
    if (error instanceof Error) return error.message;
    return '工具调用失败';
  }

  private formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
    if (!errors || errors.length === 0) return 'graph 参数不符合 schema';
    
    const messages = errors.slice(0, 5).map((error) => {
      let path = error.instancePath ? `graph${error.instancePath.replace(/\//g, '.')}` : 'graph';
      if (error.keyword === 'required') {
        const missingProperty = (error.params as { missingProperty?: string }).missingProperty;
        if (missingProperty) path = `${path}.${missingProperty}`;
      }
      return `${path}: ${error.message ?? 'invalid value'}`;
    });

    return `graph 参数不符合 schema: ${messages.join('; ')}`;
  }
}
