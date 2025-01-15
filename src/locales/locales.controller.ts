import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

import { LocalesService } from './locales.service';
import { CreateLocaleDto } from './dto/create-locale.dto';
import { UpdateLocaleDto } from './dto/update-locale.dto';

@Controller('locales')
export class LocalesController {
  constructor(private readonly localesService: LocalesService) {}

  @Post()
  create(@Body() createLocaleDto: CreateLocaleDto) {
    return this.localesService.create(createLocaleDto);
  }

  @Get()
  async findAll(@Res({ passthrough: true }) res: Response) {
    try {
      const list = await this.localesService.findAll();
      res
        .status(HttpStatus.OK)
        .header('Content-Range', `locales 0-${list?.length}/${list?.length}`);
      return list;
    } catch (e) {
      console.log(e);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.localesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLocaleDto: UpdateLocaleDto) {
    return this.localesService.update(id, updateLocaleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.localesService.remove(id);
  }
}
