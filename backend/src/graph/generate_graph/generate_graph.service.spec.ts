import { Test, TestingModule } from '@nestjs/testing';
import { GenerateGraphService } from './generate_graph.service';

describe('GenerateGraphService', () => {
  let service: GenerateGraphService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateGraphService],
    }).compile();

    service = module.get<GenerateGraphService>(GenerateGraphService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
