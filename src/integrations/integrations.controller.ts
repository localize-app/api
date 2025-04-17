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
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new integration' })
  @ApiBody({ type: CreateIntegrationDto })
  create(@Body() createIntegrationDto: CreateIntegrationDto) {
    return this.integrationsService.create(createIntegrationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all integrations with optional filtering' })
  @ApiQuery({
    name: 'project',
    required: false,
    description: 'Filter by project ID',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by integration type',
  })
  @ApiQuery({
    name: 'isEnabled',
    required: false,
    description: 'Filter by enabled status',
  })
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query() query: any,
  ) {
    try {
      const list = await this.integrationsService.findAll(query);
      res
        .status(HttpStatus.OK)
        .header(
          'Content-Range',
          `integrations 0-${list?.length}/${list?.length}`,
        );
      return list;
    } catch (e) {
      console.log(e);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration by ID' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  findOne(@Param('id') id: string) {
    return this.integrationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update integration by ID' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiBody({ type: UpdateIntegrationDto })
  update(
    @Param('id') id: string,
    @Body() updateIntegrationDto: UpdateIntegrationDto,
  ) {
    return this.integrationsService.update(id, updateIntegrationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete integration by ID' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  remove(@Param('id') id: string) {
    return this.integrationsService.remove(id);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync integration with external service' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  syncIntegration(@Param('id') id: string) {
    return this.integrationsService.syncIntegration(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Enable or disable an integration' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiBody({ schema: { properties: { isEnabled: { type: 'boolean' } } } })
  toggleStatus(@Param('id') id: string, @Body('isEnabled') isEnabled: boolean) {
    return this.integrationsService.toggleStatus(id, isEnabled);
  }
}
