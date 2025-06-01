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
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { PhrasesService } from './phrases.service';
import { CreatePhraseDto } from './dto/create-phrase.dto';
import { UpdatePhraseDto } from './dto/update-phrase.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { BatchOperationDto } from './dto/batch-operation.dto';
import { AddTranslationDto } from './dto/add-translation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RequirePermission } from '../auth/decorators/permission.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { ExtractPhrasesDto } from './dto/extract-phrases.dto';

@ApiTags('Phrases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('phrases')
export class PhrasesController {
  constructor(private readonly phrasesService: PhrasesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @RequirePermission('canCreatePhrases')
  @ApiOperation({ summary: 'Create a new phrase' })
  @ApiBody({ type: CreatePhraseDto })
  @ApiResponse({
    status: 201,
    description: 'The phrase has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(@Body() createPhraseDto: CreatePhraseDto) {
    return this.phrasesService.create(createPhraseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all phrases with optional filtering' })
  @ApiQuery({
    name: 'project',
    required: false,
    description: 'Filter by project ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'isArchived',
    required: false,
    description: 'Filter by archive status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in key and sourceText',
  })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Results per page for pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated phrases with total count',
  })
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query() query: any,
  ) {
    try {
      const { phrases, total } = await this.phrasesService.findAll(query);
      const limit = query.limit || 20;
      const page = query.page || 1;
      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + phrases.length - 1, total - 1);

      res
        .status(HttpStatus.OK)
        .header('Content-Range', `phrases ${startIndex}-${endIndex}/${total}`);

      return phrases;
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a phrase by ID' })
  @ApiParam({ name: 'id', description: 'Phrase ID' })
  @ApiResponse({ status: 200, description: 'Returns the phrase' })
  @ApiResponse({ status: 404, description: 'Phrase not found' })
  async findOne(@Param('id') id: string) {
    const phrase = await this.phrasesService.findOne(id);
    if (!phrase) {
      throw new NotFoundException(`Phrase with ID ${id} not found`);
    }
    return phrase;
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @RequirePermission('canEditPhrases')
  @ApiOperation({ summary: 'Update a phrase' })
  @ApiParam({ name: 'id', description: 'Phrase ID' })
  @ApiBody({ type: UpdatePhraseDto })
  @ApiResponse({
    status: 200,
    description: 'The phrase has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Phrase not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePhraseDto: UpdatePhraseDto,
  ) {
    return this.phrasesService.update(id, updatePhraseDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermission('canDeletePhrases')
  @ApiOperation({ summary: 'Delete a phrase' })
  @ApiParam({ name: 'id', description: 'Phrase ID' })
  @ApiResponse({
    status: 200,
    description: 'The phrase has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Phrase not found' })
  async remove(@Param('id') id: string) {
    return this.phrasesService.remove(id);
  }

  @Post(':id/translations/:locale')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.TRANSLATOR)
  @RequirePermission('canTranslate')
  @ApiOperation({ summary: 'Add or update a translation for a phrase' })
  @ApiParam({ name: 'id', description: 'Phrase ID' })
  @ApiParam({ name: 'locale', description: 'Locale code (e.g., fr-CA)' })
  @ApiBody({ type: AddTranslationDto })
  @ApiResponse({
    status: 200,
    description: 'Translation successfully added/updated.',
  })
  @ApiResponse({ status: 404, description: 'Phrase not found' })
  async addTranslation(
    @Param('id') id: string,
    @Param('locale') locale: string,
    @Body() addTranslationDto: AddTranslationDto,
  ) {
    return this.phrasesService.addTranslation(id, locale, addTranslationDto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @RequirePermission('canEditPhrases')
  @ApiOperation({ summary: 'Update the status of a phrase' })
  @ApiParam({ name: 'id', description: 'Phrase ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200, description: 'Status successfully updated.' })
  @ApiResponse({ status: 404, description: 'Phrase not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateStatusDto,
  ) {
    return this.phrasesService.updateStatus(id, statusDto);
  }

  @Post('batch')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @RequirePermission('canEditPhrases')
  @ApiOperation({ summary: 'Perform batch operations on phrases' })
  @ApiBody({ type: BatchOperationDto })
  @ApiResponse({
    status: 200,
    description: 'Batch operation completed successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        count: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async batchOperation(@Body() batchDto: BatchOperationDto) {
    return this.phrasesService.processBatch(batchDto);
  }

  @Get('export')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @RequirePermission('canExportData')
  @ApiOperation({ summary: 'Export phrases to a file' })
  @ApiQuery({ name: 'project', required: true, description: 'Project ID' })
  @ApiQuery({
    name: 'format',
    required: false,
    description: 'Export format (json, csv, xlsx)',
    enum: ['json', 'csv', 'xlsx'],
  })
  @ApiQuery({
    name: 'locales',
    required: false,
    description: 'Locale codes to include, comma-separated',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Status to include, comma-separated',
  })
  @ApiResponse({ status: 200, description: 'File successfully generated.' })
  async exportPhrases(
    @Res() res: Response,
    @Query('project') projectId: string,
    @Query('format') format: string = 'json',
    @Query('locales') localesParam?: string,
    @Query('status') statusParam?: string,
  ) {
    // Parse comma-separated params into arrays
    const locales = localesParam ? localesParam.split(',') : undefined;
    const status = statusParam ? statusParam.split(',') : undefined;

    // Get file content from service
    const { data, filename, mimeType } =
      await this.phrasesService.exportPhrases(
        projectId,
        format as 'json' | 'csv' | 'xlsx',
        { locales, status },
      );

    // Set response headers and return the file
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', mimeType);

    return res.send(data);
  }

  @Post('import')
  @Roles(Role.ADMIN, Role.MANAGER)
  @RequirePermission('canCreatePhrases')
  @ApiOperation({ summary: 'Import phrases from a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        project: {
          type: 'string',
        },
        overwrite: {
          type: 'boolean',
          default: false,
        },
      },
      required: ['file', 'project'],
    },
  })
  @ApiResponse({ status: 200, description: 'Phrases successfully imported.' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async importPhrases(
    @UploadedFile() file: Express.Multer.File,
    @Body('project') projectId: string,
    @Body('overwrite') overwrite: boolean = false,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.phrasesService.importPhrases(projectId, file.path, {
      overwrite,
    });
  }

  @Post('batch-extract')
  @Public()
  async extractPhrases(@Body() extractDto: ExtractPhrasesDto) {
    return this.phrasesService.batchExtract(extractDto);
  }
}
