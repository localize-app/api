import { Test, TestingModule } from '@nestjs/testing';
import { GlossaryTermsController } from './glossary-terms.controller';
import { GlossaryTermsService } from './glossary-terms.service';

describe('GlossaryTermsController', () => {
  let controller: GlossaryTermsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GlossaryTermsController],
      providers: [GlossaryTermsService],
    }).compile();

    controller = module.get<GlossaryTermsController>(GlossaryTermsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
