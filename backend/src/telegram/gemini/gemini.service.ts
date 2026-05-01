import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Content, GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiDispatcherService, DispatchContext } from './gemini-dispatcher.service';
import { GEMINI_TOOLS, GEMINI_SYSTEM_PROMPT } from './gemini-tools';

const MAX_HISTORY_MESSAGES = 20;

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly model;

  constructor(
    @Inject('GEMINI_AI') private readonly genAI: GoogleGenerativeAI,
    private readonly prisma: PrismaService,
    private readonly dispatcher: GeminiDispatcherService,
  ) {
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
      tools: GEMINI_TOOLS,
      systemInstruction: GEMINI_SYSTEM_PROMPT,
    });
  }

  async chat(telegramUserId: string, producerId: string, userText: string): Promise<string> {
    const history = await this.loadHistory(telegramUserId);
    const context: DispatchContext = { telegramUserId, producerId };

    const geminiChat = this.model.startChat({ history });

    await this.saveMessage(telegramUserId, 'USER', userText);

    let response = await geminiChat.sendMessage(userText);

    // Handle function call loop — Gemini may chain multiple tool calls
    while (response.response.functionCalls()?.length) {
      const call = response.response.functionCalls()![0];
      this.logger.debug(`Tool call: ${call.name} args=${JSON.stringify(call.args)}`);

      const result = await this.dispatcher.dispatch(
        call.name,
        call.args as Record<string, unknown>,
        context,
      );

      response = await geminiChat.sendMessage([
        { functionResponse: { name: call.name, response: { result } } },
      ]);
    }

    const finalText = response.response.text();
    await this.saveMessage(telegramUserId, 'MODEL', finalText);

    return finalText;
  }

  private async loadHistory(telegramUserId: string): Promise<Content[]> {
    const messages = await this.prisma.conversationMessage.findMany({
      where: { telegramUserId },
      orderBy: { createdAt: 'asc' },
      take: MAX_HISTORY_MESSAGES,
    });

    return messages.map((m) => ({
      role: m.role === 'USER' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));
  }

  private async saveMessage(
    telegramUserId: string,
    role: 'USER' | 'MODEL',
    content: string,
  ): Promise<void> {
    await this.prisma.conversationMessage.create({
      data: { telegramUserId, role, content },
    });
  }
}
