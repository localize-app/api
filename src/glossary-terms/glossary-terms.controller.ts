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
import { GlossaryTermsService } from './glossary-terms.service';
import { CreateGlossaryTermDto } from './dto/create-glossary-term.dto';
import { UpdateGlossaryTermDto } from './dto/update-glossary-term.dto';
import { AddTranslationDto } from './dto/add-translation.dto';

@Controller('glossary-terms')
export class GlossaryTermsController {
  constructor(private readonly GlossaryTermsService: GlossaryTermsService) {}

  @Post()
  create(@Body() createGlossaryTermDto: CreateGlossaryTermDto) {
    return this.GlossaryTermsService.create(createGlossaryTermDto);
  }

  @Get()
  async findAll(@Res({ passthrough: true }) res: Response, @Query() query) {
    try {
      const list = await this.GlossaryTermsService.findAll(query);
      res
        .status(HttpStatus.OK)
        .header('Content-Range', `glossary 0-${list?.length}/${list?.length}`);
      return list;
    } catch (e) {
      console.log(e);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.GlossaryTermsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGlossaryTermDto: UpdateGlossaryTermDto,
  ) {
    return this.GlossaryTermsService.update(id, updateGlossaryTermDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.GlossaryTermsService.remove(id);
  }

  @Post(':id/translations/:locale')
  addTranslation(
    @Param('id') id: string,
    @Param('locale') locale: string,
    @Body() addTranslationDto: AddTranslationDto,
  ) {
    return this.GlossaryTermsService.addTranslation(
      id,
      locale,
      addTranslationDto,
    );
  }

  @Delete(':id/translations/:locale')
  removeTranslation(@Param('id') id: string, @Param('locale') locale: string) {
    return this.GlossaryTermsService.removeTranslation(id, locale);
  }

  @Post('sync/google/:companyId/:locale')
  syncWithGoogle(
    @Param('companyId') companyId: string,
    @Param('locale') locale: string,
  ) {
    return this.GlossaryTermsService.syncWithGoogle(companyId, locale);
  }
}
