import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Controller('labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  create(@Body() createLabelDto: CreateLabelDto) {
    return this.labelsService.create(createLabelDto);
  }

  @Get()
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query() query: any,
  ) {
    try {
      const list = await this.labelsService.findAll(query);
      res
        .status(HttpStatus.OK)
        .header('Content-Range', `labels 0-${list?.length}/${list?.length}`);
      return list;
    } catch (e) {
      console.log(e);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.labelsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLabelDto: UpdateLabelDto) {
    return this.labelsService.update(id, updateLabelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.labelsService.remove(id);
  }

  @Post(':id/increment-usage')
  incrementUsage(@Param('id') id: string) {
    return this.labelsService.incrementUsage(id);
  }

  @Post(':id/decrement-usage')
  decrementUsage(@Param('id') id: string) {
    return this.labelsService.decrementUsage(id);
  }
}