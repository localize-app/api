import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Order, OrderDocument, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Phrase, PhraseDocument } from '../phrases/entities/phrase.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Phrase.name) private phraseModel: Model<PhraseDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto, createdById: string, companyId: string): Promise<Order> {
    // Calculate total words from phrases
    let totalWords = 0;
    if (createOrderDto.phrases && createOrderDto.phrases.length > 0) {
      const phrases = await this.phraseModel.find({
        _id: { $in: createOrderDto.phrases }
      });
      totalWords = phrases.reduce((sum, phrase) => {
        return sum + (phrase.sourceText ? phrase.sourceText.split(' ').length : 0);
      }, 0);
    }

    const orderData = {
      ...createOrderDto,
      createdBy: createdById,
      company: companyId,
      totalWords,
    };

    const order = new this.orderModel(orderData);
    return order.save();
  }

  async findAll(companyId?: string): Promise<Order[]> {
    const filter = companyId ? { company: companyId } : {};
    
    return this.orderModel
      .find(filter)
      .populate('project')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'name')
      .populate('phrases', 'text key status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('project')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'name')
      .populate('phrases', 'text key status')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(id: string, updateStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const updateData: any = {
      status: updateStatusDto.status,
      updatedAt: new Date(),
    };

    // If marking as completed, add completion timestamp and notes
    if (updateStatusDto.status === OrderStatus.COMPLETED) {
      updateData.completedAt = new Date();
      if (updateStatusDto.completionNotes) {
        updateData.completionNotes = updateStatusDto.completionNotes;
      }
    }

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('project')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'name')
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Send email notification if order is completed
    if (updateStatusDto.status === OrderStatus.COMPLETED) {
      await this.notifyCompanyOwnerOrderCompleted(updatedOrder);
    }

    return updatedOrder;
  }

  /**
   * Notify company owner when order is completed
   */
  private async notifyCompanyOwnerOrderCompleted(order: Order): Promise<void> {
    try {
      this.logger.log(`📧 EMAIL NOTIFICATION: Order "${order.title}" has been completed`);
      this.logger.log(`📧 Project: ${(order.project as any)?.name || 'Unknown'}`);
      this.logger.log(`📧 Completed by: ${(order.assignedTo as any)?.firstName} ${(order.assignedTo as any)?.lastName}`);
      this.logger.log(`📧 Company: ${(order.company as any)?.name || 'Unknown'}`);
      this.logger.log(`📧 Completion notes: ${order.completionNotes || 'None'}`);
      
      // TODO: Implement actual email sending to company owner
      // 1. Send email to order.createdBy (company owner)
      // 2. Include order details, completion notes, and project information
      
    } catch (error) {
      this.logger.error(`Failed to send order completion notification: ${error.message}`);
      // Don't throw error to avoid disrupting order status update
    }
  }

  async assignToTranslator(id: string, translatorId: string): Promise<Order> {
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        id,
        { 
          assignedTo: translatorId,
          status: OrderStatus.IN_PROGRESS,
          updatedAt: new Date(),
        },
        { new: true }
      )
      .populate('project')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('company', 'name')
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return updatedOrder;
  }

  async findByTranslator(translatorId: string): Promise<Order[]> {
    return this.orderModel
      .find({ assignedTo: translatorId })
      .populate('project')
      .populate('createdBy', 'firstName lastName email')
      .populate('company', 'name')
      .populate('phrases', 'text key status')
      .sort({ createdAt: -1 })
      .exec();
  }
}