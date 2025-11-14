import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderType } from '../entities/order.entity';

export class CreateOrderDto {
  @ApiProperty({ description: 'Order title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Order description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Project ID' })
  @IsString()
  project: string;

  @ApiProperty({
    description: 'User ID to assign this order to',
    required: false,
  })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiProperty({ description: 'Order type', enum: OrderType })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({ description: 'Source language codes', type: [String] })
  @IsArray()
  @IsString({ each: true })
  sourceLocales: string[];

  @ApiProperty({ description: 'Target language codes', type: [String] })
  @IsArray()
  @IsString({ each: true })
  targetLocales: string[];

  @ApiProperty({ description: 'Deadline date', required: false })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiProperty({
    description: 'Array of phrase IDs to include in this order',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  phrases: string[];

  @ApiProperty({ description: 'Priority level', required: false })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({ description: 'Estimated hours to complete', required: false })
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;
}
