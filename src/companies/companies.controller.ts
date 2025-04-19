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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CompanyWithUsersDto } from './dto/company-with-users.dto';

@ApiTags('Companies')
@ApiBearerAuth() // Add bearer auth to Swagger docs
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({
    status: 201,
    description: 'Company successfully created',
    type: CompanyWithUsersDto,
  })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies with their users' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of companies with user data',
    type: [CompanyWithUsersDto],
  })
  async findAll(@Res({ passthrough: true }) res: Response) {
    try {
      const list = await this.companiesService.findAll();
      res
        .status(HttpStatus.OK)
        .header('Content-Range', `companies 0-${list?.length}/${list?.length}`);
      return list;
    } catch (e) {
      console.log(e);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company by ID with its users' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a company with user data',
    type: CompanyWithUsersDto,
  })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Update a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Company successfully updated',
    type: CompanyWithUsersDto,
  })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN) // Only admin role can delete companies
  @ApiOperation({ summary: 'Delete a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company successfully deleted' })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }

  @Post(':id/users/:userId')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Add a user to a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User successfully added to company',
    type: CompanyWithUsersDto,
  })
  addUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.companiesService.addUser(id, userId);
  }

  @Delete(':id/users/:userId')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Remove a user from a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User successfully removed from company',
    type: CompanyWithUsersDto,
  })
  removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.companiesService.removeUser(id, userId);
  }
}
