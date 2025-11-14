import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StyleGuidesService } from './style-guides.service';
import { CreateStyleGuideDto } from './dto/create-style-guide.dto';
import { UpdateStyleGuideDto } from './dto/update-style-guide.dto';

@Controller('style-guides')
export class StyleGuidesController {
  constructor(private readonly styleGuidesService: StyleGuidesService) {}

  @Post()
  create(@Body() createStyleGuideDto: CreateStyleGuideDto) {
    return this.styleGuidesService.create(createStyleGuideDto);
  }

  @Get()
  findAll() {
    return this.styleGuidesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.styleGuidesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStyleGuideDto: UpdateStyleGuideDto,
  ) {
    return this.styleGuidesService.update(+id, updateStyleGuideDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.styleGuidesService.remove(+id);
  }
}
