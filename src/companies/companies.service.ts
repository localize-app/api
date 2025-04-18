import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './entities/company.entity';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { CompanyWithUsers } from './interfaces/company-with-users.interface';
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
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Create a new company
  async create(createCompanyDto: CreateCompanyDto): Promise<CompanyWithUsers> {
    const session = await this.companyModel.db.startSession();
    session.startTransaction();

    try {
      // Check if a company with the same name already exists
      const existingCompany = await this.companyModel
        .findOne({
          name: createCompanyDto.name,
        })
        .session(session)
        .exec();

      if (existingCompany) {
        throw new DuplicateEntityException(
          'Company',
          'name',
          createCompanyDto.name,
        );
      }

      const newCompany = new this.companyModel(createCompanyDto);
      await newCompany.save({ session });

      await session.commitTransaction();

      // Return company with empty users array
      const companyObj = newCompany.toObject();

      // Create a CompanyWithUsers object
      const companyWithUsers = {
        ...companyObj,
        users: [],
      };

      return companyWithUsers;
    } catch (error) {
      await session.abortTransaction();
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
    } finally {
      session.endSession();
    }
  }

  // Get all companies with their associated users
  async findAll(): Promise<CompanyWithUsers[]> {
    try {
      const companies = await this.companyModel
        .find()
        .populate('projects')
        .exec();

      // Fetch users for each company and add them to the response
      const companiesWithUsers = await Promise.all(
        companies.map(async (company) => {
          const users = await this.userModel
            .find({ company: company._id })
            .exec();

          const companyObj = company.toObject();

          // Create a CompanyWithUsers object
          return {
            ...companyObj,
            users: users,
          };
        }),
      );

      return companiesWithUsers;
    } catch (error) {
      this.logger.error(
        `Failed to fetch companies: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Get a specific company by ID with associated users
  async findOne(id: string): Promise<CompanyWithUsers> {
    try {
      const company = await this.companyModel
        .findById(id)
        .populate('projects')
        .exec();

      if (!company) {
        throw new EntityNotFoundException('Company', id);
      }

      // Get users belonging to this company
      const users = await this.userModel.find({ company: id }).exec();

      const companyObj = company.toObject();

      // Create a CompanyWithUsers object
      return {
        ...companyObj,
        users: users,
      };
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
  ): Promise<CompanyWithUsers> {
    const session = await this.companyModel.db.startSession();
    session.startTransaction();

    try {
      // Check if updating name and if the new name already exists
      if (updateCompanyDto.name) {
        const existingCompany = await this.companyModel
          .findOne({
            name: updateCompanyDto.name,
            _id: { $ne: id },
          })
          .session(session)
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
        .findByIdAndUpdate(id, updateCompanyDto, { new: true, session })
        .populate('projects')
        .exec();

      if (!updatedCompany) {
        throw new EntityNotFoundException('Company', id);
      }

      // Get users belonging to this company
      const users = await this.userModel
        .find({ company: id })
        .session(session)
        .exec();

      await session.commitTransaction();

      const companyObj = updatedCompany.toObject();

      // Create a CompanyWithUsers object
      return {
        ...companyObj,
        users: users,
      };
    } catch (error) {
      await session.abortTransaction();
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
    } finally {
      session.endSession();
    }
  }

  // Delete a company
  async remove(id: string): Promise<void> {
    const session = await this.companyModel.db.startSession();
    session.startTransaction();

    try {
      // First check if company exists
      const company = await this.companyModel
        .findById(id)
        .session(session)
        .exec();

      if (!company) {
        throw new EntityNotFoundException('Company', id);
      }

      // Remove company reference from users
      await this.userModel
        .updateMany({ company: id }, { $unset: { company: '' } }, { session })
        .exec();

      // Delete the company
      await this.companyModel.findByIdAndDelete(id).session(session).exec();

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
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
    } finally {
      session.endSession();
    }
  }

  // Add a user to a company
  async addUser(companyId: string, userId: string): Promise<CompanyWithUsers> {
    const session = await this.companyModel.db.startSession();
    session.startTransaction();

    try {
      // Check if company exists
      const company = await this.companyModel
        .findById(companyId)
        .session(session)
        .exec();

      if (!company) {
        throw new EntityNotFoundException('Company', companyId);
      }

      // Update user's company field
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          { company: companyId },
          { new: true, session },
        )
        .exec();

      if (!updatedUser) {
        throw new EntityNotFoundException('User', userId);
      }

      await session.commitTransaction();

      // Get all users for this company
      const users = await this.userModel.find({ company: companyId }).exec();

      const companyObj = company.toObject();

      // Create a CompanyWithUsers object
      return {
        ...companyObj,
        users: users,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(
        `Failed to add user to company: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Remove a user from a company
  async removeUser(
    companyId: string,
    userId: string,
  ): Promise<CompanyWithUsers> {
    const session = await this.companyModel.db.startSession();
    session.startTransaction();

    try {
      // Check if company exists
      const company = await this.companyModel
        .findById(companyId)
        .session(session)
        .exec();

      if (!company) {
        throw new EntityNotFoundException('Company', companyId);
      }

      // Remove company from user
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $unset: { company: '' } },
          { new: true, session },
        )
        .exec();

      if (!updatedUser) {
        throw new EntityNotFoundException('User', userId);
      }

      await session.commitTransaction();

      // Get all users for this company
      const users = await this.userModel.find({ company: companyId }).exec();

      const companyObj = company.toObject();

      // Create a CompanyWithUsers object
      return {
        ...companyObj,
        users: users,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(
        `Failed to remove user from company: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      session.endSession();
    }
  }
}
