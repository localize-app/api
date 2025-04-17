import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './entities/company.entity';
import {
  DuplicateEntityException,
  EntityNotFoundException,
  ValidationFailedException,
} from 'src/common/filters/custom-exceptions';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  // Create a new company
  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    try {
      // Check if a company with the same name already exists
      const existingCompany = await this.companyModel
        .findOne({
          name: createCompanyDto.name,
        })
        .exec();

      if (existingCompany) {
        throw new DuplicateEntityException(
          'Company',
          'name',
          createCompanyDto.name,
        );
      }

      const newCompany = new this.companyModel(createCompanyDto);
      return await newCompany.save();
    } catch (error) {
      this.logger.error(
        `Failed to create company: ${error.message}`,
        error.stack,
      );

      // Re-throw specific exceptions
      if (error instanceof DuplicateEntityException) {
        throw error;
      }

      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(
          (err: any) => err.message,
        );
        throw new ValidationFailedException(errors);
      }

      // Handle MongoDB duplicate key error (code 11000)
      if (error.name === 'MongoError' && error.code === 11000) {
        throw new DuplicateEntityException(
          'Company',
          'name',
          createCompanyDto.name,
        );
      }

      // Re-throw the original error
      throw error;
    }
  }

  // Get all companies
  async findAll(): Promise<Company[]> {
    try {
      return await this.companyModel
        .find()
        .populate('projects')
        .populate('users')
        .exec();
    } catch (error) {
      this.logger.error(
        `Failed to fetch companies: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Get a specific company by ID
  async findOne(id: string): Promise<Company> {
    try {
      const company = await this.companyModel
        .findById(id)
        .populate('projects')
        .populate('users')
        .exec();

      if (!company) {
        throw new EntityNotFoundException('Company', id);
      }

      return company;
    } catch (error) {
      this.logger.error(
        `Failed to fetch company with ID ${id}: ${error.message}`,
        error.stack,
      );

      // Re-throw specific exceptions
      if (error instanceof EntityNotFoundException) {
        throw error;
      }

      // Handle invalid MongoDB ID format
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        throw new EntityNotFoundException('Company', id);
      }

      // Re-throw the original error
      throw error;
    }
  }

  // Update a company
  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    try {
      // Check if updating name and if the new name already exists
      if (updateCompanyDto.name) {
        const existingCompany = await this.companyModel
          .findOne({
            name: updateCompanyDto.name,
            _id: { $ne: id },
          })
          .exec();

        if (existingCompany) {
          throw new DuplicateEntityException(
            'Company',
            'name',
            updateCompanyDto.name,
          );
        }
      }

      const updatedCompany = await this.companyModel
        .findByIdAndUpdate(id, updateCompanyDto, { new: true })
        .populate('projects')
        .populate('users')
        .exec();

      if (!updatedCompany) {
        throw new EntityNotFoundException('Company', id);
      }

      return updatedCompany;
    } catch (error) {
      this.logger.error(
        `Failed to update company with ID ${id}: ${error.message}`,
        error.stack,
      );

      // Re-throw specific exceptions
      if (
        error instanceof EntityNotFoundException ||
        error instanceof DuplicateEntityException
      ) {
        throw error;
      }

      // Handle invalid MongoDB ID format
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        throw new EntityNotFoundException('Company', id);
      }

      // Handle MongoDB duplicate key error (code 11000)
      if (error.name === 'MongoError' && error.code === 11000) {
        throw new DuplicateEntityException(
          'Company',
          'name',
          updateCompanyDto.name || 'unknown',
        );
      }

      // Re-throw the original error
      throw error;
    }
  }

  // Delete a company
  async remove(id: string): Promise<void> {
    try {
      const result = await this.companyModel.findByIdAndDelete(id).exec();

      if (!result) {
        throw new EntityNotFoundException('Company', id);
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete company with ID ${id}: ${error.message}`,
        error.stack,
      );

      // Re-throw specific exceptions
      if (error instanceof EntityNotFoundException) {
        throw error;
      }

      // Handle invalid MongoDB ID format
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        throw new EntityNotFoundException('Company', id);
      }

      // Re-throw the original error
      throw error;
    }
  }
}
