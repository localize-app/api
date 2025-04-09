import { Test, TestingModule } from '@nestjs/testing';
import { StyleGuidesService } from './style-guides.service';

describe('StyleGuidesService', () => {
  let service: StyleGuidesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StyleGuidesService],
    }).compile();

    service = module.get<StyleGuidesService>(StyleGuidesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
