import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Role } from '../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermission } from '../auth/decorators/permission.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canCreateOrders')
  @ApiOperation({ summary: 'Create a new translation order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    try {
      const companyId = req.user.company?.id || req.user.company?._id || req.user.company;
      return await this.ordersService.create(createOrderDto, req.user.id, companyId);
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to create order: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @RequirePermission('canViewOrders')
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findAll(@Request() req: any) {
    try {
      // Company owners see only their company's orders
      const companyId = req.user.role === Role.COMPANY_OWNER
        ? req.user.company?.id || req.user.company?._id || req.user.company
        : undefined;
      
      return await this.ordersService.findAll(companyId);
    } catch (error) {
      this.logger.error(`Failed to fetch orders: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-orders')
  @Roles(Role.TRANSLATOR)
  @ApiOperation({ summary: 'Get orders assigned to current translator' })
  @ApiResponse({ status: 200, description: 'Assigned orders retrieved successfully' })
  async getMyOrders(@Request() req: any) {
    try {
      return await this.ordersService.findByTranslator(req.user.id);
    } catch (error) {
      this.logger.error(`Failed to fetch assigned orders: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch assigned orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @RequirePermission('canViewOrders')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.ordersService.findOne(id);
    } catch (error) {
      this.logger.error(`Failed to fetch order ${id}: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch order: ${error.message}`,
        error.status || HttpStatus.NOT_FOUND,
      );
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    try {
      return await this.ordersService.updateStatus(id, updateStatusDto);
    } catch (error) {
      this.logger.error(`Failed to update order status: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to update order status: ${error.message}`,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/assign/:translatorId')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canManageOrders')
  @ApiOperation({ summary: 'Assign order to translator' })
  @ApiResponse({ status: 200, description: 'Order assigned successfully' })
  async assignToTranslator(
    @Param('id') id: string,
    @Param('translatorId') translatorId: string,
  ) {
    try {
      return await this.ordersService.assignToTranslator(id, translatorId);
    } catch (error) {
      this.logger.error(`Failed to assign order: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to assign order: ${error.message}`,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}