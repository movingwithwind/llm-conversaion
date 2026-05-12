import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { FileService } from './file/file.service';
import { AiService } from './ai/ai.service';

describe('ChatController', () => {
  let controller: ChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: FileService, useValue: { processFile: jest.fn(), getProcessedByUrl: jest.fn() } },
        { provide: AiService, useValue: { getAIresponse: jest.fn() } },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
