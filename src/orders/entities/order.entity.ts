import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';
import { Phrase } from '../../phrases/entities/phrase.entity';
import { BaseEntity, baseSchemaOptions } from '../../common/entities/base.entity';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum OrderType {
  TRANSLATION = 'translation',
  REVIEW = 'review',
  PROOFREADING = 'proofreading',
}

@Schema(baseSchemaOptions)
export class Order extends BaseEntity {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  })
  project: Project;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  })
  company: Company;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: User; // Company owner who created the order

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  assignedTo?: User; // Translator assigned to the order

  @Prop({
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    type: String,
  })
  status: OrderStatus;

  @Prop({
    enum: Object.values(OrderType),
    default: OrderType.TRANSLATION,
    type: String,
  })
  type: OrderType;

  @Prop({ type: [String], default: [] })
  sourceLocales: string[]; // Languages to translate from

  @Prop({ type: [String], default: [] })
  targetLocales: string[]; // Languages to translate to

  @Prop({ type: Date })
  deadline?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop()
  completionNotes?: string; // Notes from translator when marking as completed

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Phrase' }],
    default: [],
  })
  phrases: Phrase[]; // Array of phrases included in this order

  @Prop({ type: Number, default: 0 })
  totalWords: number; // Total word count for all phrases

  @Prop({ type: Number, default: 0 })
  estimatedHours: number; // Estimated hours to complete

  @Prop()
  priority?: string; // low, medium, high
}

export const OrderSchema = SchemaFactory.createForClass(Order);