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
import { PhrasesService } from './phrases.service';
import { CreatePhraseDto } from './dto/create-phrase.dto';
import { UpdatePhraseDto } from './dto/update-phrase.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { BatchOperationDto } from './dto/batch-operation.dto';
import { AddTranslationDto } from 'src/glossary-terms/dto/add-translation.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { ExtractPhrasesDto } from './dto/extract-phrases.dto';

@Controller('phrases')
export class PhrasesController {
  constructor(private readonly phrasesService: PhrasesService) {}

  @Post()
  create(@Body() createPhraseDto: CreatePhraseDto) {
    return this.phrasesService.create(createPhraseDto);
  }

  @Get()
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query() query: any,
  ) {
    try {
      const list = await this.phrasesService.findAll(query);
      res
        .status(HttpStatus.OK)
        .header('Content-Range', `phrases 0-${list?.length}/${list?.length}`);
      return list;
    } catch (e) {
      console.log(e);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.phrasesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePhraseDto: UpdatePhraseDto) {
    return this.phrasesService.update(id, updatePhraseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.phrasesService.remove(id);
  }

  @Post(':id/translations/:locale')
  addTranslation(
    @Param('id') id: string,
    @Param('locale') locale: string,
    @Body() translationDto: AddTranslationDto,
  ) {
    return this.phrasesService.addTranslation(id, locale, translationDto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() statusDto: UpdateStatusDto) {
    return this.phrasesService.updateStatus(id, statusDto);
  }

  @Post('batch')
  batchOperation(@Body() batchDto: BatchOperationDto) {
    return this.phrasesService.processBatch(batchDto);
  }

  @Post('/batch-extract')
  @Public()
  async extractPhrases(@Body() extractDto: ExtractPhrasesDto) {
    console.log('extractDto', extractDto);

    return this.phrasesService.batchExtract(extractDto);
  }
}
