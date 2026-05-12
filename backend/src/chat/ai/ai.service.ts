//src\chat\ai\ai.service.ts
import { Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import { systemprompt_conversation } from 'src/model';


type UpstreamUserContent =
  | { type: 'input_image'; image_url: string; detail: 'auto' | 'low' | 'high' }
  | { type: 'input_text'; text: string };

type UpstreamMessage =
  | { role: 'user'; content: UpstreamUserContent[] }
  | { role: 'system'; content: UpstreamUserContent[] }
  | { role: 'developer'; content: UpstreamUserContent[] };

@Injectable()
export class AiService {
  getAIresponse(
    content: UpstreamMessage[] | undefined,
    abortController: AbortController,
    model: string,
  ): Promise<Response> {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL?.trim();
    const configuredModel = process.env.OPENAI_MODEL?.trim();
    const Model = model || configuredModel || 'qwen3.5-flash';
    const systemPrompt = systemprompt_conversation.trim();

    if (!apiKey) {
      throw new InternalServerErrorException('服务端缺少 OPENAI_API_KEY');
    }

    return fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: Model,
        stream: true, //开启流式响应
        input: [
          ...(systemPrompt
            ? [
                {
                  role: 'system',
                  content: [{ type: 'input_text', text: systemPrompt }],
                },
              ]
            : []),
          ...(content ?? []),
        ],
        temperature: 0.7,
      }),
      signal: abortController.signal,
    });
  }
}
