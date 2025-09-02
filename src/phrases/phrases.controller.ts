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
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER, Role.MEMBER)
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

  @Get('by-status/:projectId/:status')
  @ApiOperation({
    summary: 'Get phrases by overall status',
    description:
      'Retrieve phrases filtered by their overall translation status. Can be filtered by specific locale.',
  })
  @ApiParam({
    name: 'projectId',
    description: 'Project ID',
    example: '683b078a81c83419eb10d144',
  })
  @ApiParam({
    name: 'status',
    description: 'Overall status to filter by',
    enum: ['pending', 'approved', 'needs_attention', 'ready', 'untranslated'],
    example: 'pending',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    description:
      'Filter by specific locale (e.g., fr-CA). If not provided, checks all locales.',
    example: 'fr-CA',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (starts from 1)',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Results per page for pagination (max 100)',
    example: 10,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved phrases with pagination headers',
    headers: {
      'Content-Range': {
        description: 'Pagination information (e.g., "phrases 0-9/25")',
        schema: { type: 'string' },
      },
    },
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '683b078a81c83419eb10d144' },
          key: { type: 'string', example: 'welcome_message' },
          sourceText: { type: 'string', example: 'Welcome to our app!' },
          context: { type: 'string', example: 'Homepage greeting' },
          project: { type: 'object' },
          translations: { type: 'object' },
          tags: { type: 'array', items: { type: 'string' } },
          isArchived: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getPhrasesByStatus(
    @Param('projectId') projectId: string,
    @Param('status')
    status:
      | 'pending'
      | 'approved'
      | 'needs_attention'
      | 'ready'
      | 'untranslated',
    @Res({ passthrough: true }) res: Response,
    @Query('locale') locale?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Parse and validate pagination parameters
    const pageNumber = page ? Math.max(1, parseInt(page, 10)) : 1;
    const limitNumber = limit
      ? Math.min(100, Math.max(1, parseInt(limit, 10)))
      : 20;

    // Validate projectId format (basic MongoDB ObjectId check)
    if (!projectId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new BadRequestException('Invalid project ID format');
    }

    // Validate status parameter
    const validStatuses = [
      'pending',
      'approved',
      'needs_attention',
      'ready',
      'untranslated',
    ];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    try {
      const { phrases, total } =
        await this.phrasesService.getPhrasesByOverallStatus(projectId, status, {
          page: pageNumber,
          limit: limitNumber,
          locale,
        });

      // Calculate pagination info
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = Math.min(startIndex + phrases.length - 1, total - 1);

      // Set Content-Range header for pagination info
      res
        .status(HttpStatus.OK)
        .header(
          'Content-Range',
          `phrases ${startIndex}-${endIndex >= 0 ? endIndex : 0}/${total}`,
        )
        .header('X-Total-Count', total.toString())
        .header('X-Page', pageNumber.toString())
        .header('X-Per-Page', limitNumber.toString())
        .header('X-Total-Pages', Math.ceil(total / limitNumber).toString());

      return {
        data: phrases,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
          hasNext: pageNumber * limitNumber < total,
          hasPrev: pageNumber > 1,
        },
      };
    } catch (error) {
      // this.logger.error(
      //   `Error getting phrases by status: ${error.message}`,
      //   error.stack,
      // );

      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }

  @Get('search/:projectId')
  @ApiOperation({ summary: 'Advanced search phrases with filters' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'text', required: false, description: 'Search in sourceText, key, context' })
  @ApiQuery({ name: 'key', required: false, description: 'Search in phrase key' })
  @ApiQuery({ name: 'context', required: false, description: 'Search in context' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'translationStatus', required: false, description: 'Translation status' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale code' })
  @ApiQuery({ name: 'hasTranslation', required: false, description: 'Has any translation (true/false)' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Date range from (ISO date)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Date range to (ISO date)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async searchPhrases(
    @Param('projectId') projectId: string,
    @Query('text') text?: string,
    @Query('key') key?: string,
    @Query('context') context?: string,
    @Query('tags') tags?: string,
    @Query('translationStatus') translationStatus?: string,
    @Query('locale') locale?: string,
    @Query('hasTranslation') hasTranslation?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const searchParams = {
      text,
      key,
      context,
      tags: tags ? tags.split(',') : undefined,
      translationStatus,
      locale,
      hasTranslation: hasTranslation ? hasTranslation === 'true' : undefined,
      dateRange: (dateFrom || dateTo) ? {
        from: dateFrom ? new Date(dateFrom) : undefined,
        to: dateTo ? new Date(dateTo) : undefined,
      } : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    };

    return this.phrasesService.searchPhrases(projectId, searchParams);
  }

  @Get('stats/:projectId')
  @ApiOperation({ summary: 'Get phrase statistics for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns phrase statistics',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        untranslated: { type: 'number' },
        pending: { type: 'number' },
        approved: { type: 'number' },
        needsAttention: { type: 'number' },
        ready: { type: 'number' },
        byLocale: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              pending: { type: 'number' },
              approved: { type: 'number' },
              rejected: { type: 'number' },
              needsReview: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getPhraseStats(@Param('projectId') projectId: string) {
    return this.phrasesService.getProjectPhraseStats(projectId);
  }

  // Update the existing findAll method's query parameters
  @Get('export')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER, Role.MEMBER)
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

  @Get()
  @ApiOperation({ summary: 'Get all phrases with optional filtering' })
  @ApiQuery({
    name: 'project',
    required: false,
    description: 'Filter by project ID',
  })
  @ApiQuery({
    name: 'translationStatus', // Changed from 'status'
    required: false,
    description:
      'Filter by translation status (pending, approved, rejected, needs_review)',
    enum: ['pending', 'approved', 'rejected', 'needs_review'],
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    description: 'Filter by specific locale (use with translationStatus)',
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
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER, Role.MEMBER)
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
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
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
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER, Role.MEMBER, Role.TRANSLATOR)
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
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER, Role.MEMBER)
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

  @Patch(':id/translations/:locale/status')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER, Role.MEMBER)
  @RequirePermission('canReviewTranslations')
  @ApiOperation({ summary: 'Update translation status for a specific locale' })
  @ApiParam({ name: 'id', description: 'Phrase ID' })
  @ApiParam({ name: 'locale', description: 'Locale code (e.g., fr-CA)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'approved', 'rejected', 'needs_review'],
          description: 'New translation status',
        },
        reviewComments: {
          type: 'string',
          description: 'Optional review comments',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Translation status successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Phrase or translation not found' })
  async updateTranslationStatus(
    @Param('id') id: string,
    @Param('locale') locale: string,
    @Body() statusData: { status: string; reviewComments?: string },
  ) {
    return this.phrasesService.updateTranslationStatus(id, locale, {
      status: statusData.status as any,
      reviewComments: statusData.reviewComments,
    });
  }

  @Post('batch')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER, Role.MEMBER)
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

  @Post('import')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
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

  @Post(':id/translations/:locale/review')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER, Role.MEMBER)
  @RequirePermission('canReviewTranslations')
  @ApiOperation({
    summary: 'Review a translation (approve/reject/request review)',
  })
  @ApiParam({ name: 'id', description: 'Phrase ID' })
  @ApiParam({ name: 'locale', description: 'Locale code (e.g., fr-CA)' })
  async reviewTranslation(
    @Param('id') id: string,
    @Param('locale') locale: string,
    @Body()
    body: {
      action: 'approve' | 'reject' | 'request_review';
      comments?: string;
      reviewerId: string;
    },
  ) {
    return this.phrasesService.reviewTranslation(
      id,
      locale,
      body.action,
      body.reviewerId,
      body.comments,
    );
  }
}
