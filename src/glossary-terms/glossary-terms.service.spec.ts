import { Test, TestingModule } from '@nestjs/testing';
import { GlossaryTermsService } from './glossary-terms.service';

describe('GlossaryTermsService', () => {
  let service: GlossaryTermsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlossaryTermsService],
    }).compile();

    service = module.get<GlossaryTermsService>(GlossaryTermsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
