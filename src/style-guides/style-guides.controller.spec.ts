import { Test, TestingModule } from '@nestjs/testing';
import { StyleGuidesController } from './style-guides.controller';
import { StyleGuidesService } from './style-guides.service';

describe('StyleGuidesController', () => {
  let controller: StyleGuidesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StyleGuidesController],
      providers: [StyleGuidesService],
    }).compile();

    controller = module.get<StyleGuidesController>(StyleGuidesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
