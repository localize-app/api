import { Injectable } from '@nestjs/common';
import { CreateStyleGuideDto } from './dto/create-style-guide.dto';
import { UpdateStyleGuideDto } from './dto/update-style-guide.dto';

@Injectable()
export class StyleGuidesService {
  create(createStyleGuideDto: CreateStyleGuideDto) {
    return 'This action adds a new styleGuide';
  }

  findAll() {
    return `This action returns all styleGuides`;
  }

  findOne(id: number) {
    return `This action returns a #${id} styleGuide`;
  }

  update(id: number, updateStyleGuideDto: UpdateStyleGuideDto) {
    return `This action updates a #${id} styleGuide`;
  }

  remove(id: number) {
    return `This action removes a #${id} styleGuide`;
  }
}
