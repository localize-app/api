import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { Role } from 'src/common/enums/role.enum';
import { UserPermissions } from './entities/user-permissions.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Create a new user
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // If the request has a password, hash it before storing as passwordHash
      if (createUserDto?.password) {
        const { password, role, ...userData } = createUserDto;

        // Hash the password if it hasn't been hashed already
        const passwordHash =
          password.startsWith('$2') && password.length > 50
            ? password // Already hashed
            : await bcrypt.hash(password, 10); // Hash it now

        // Determine role
        const userRole = role || Role.MEMBER;

        const newUser = new this.userModel({
          ...userData,
          passwordHash,
          role: userRole,
        });

        await newUser.save();
        return newUser.toJSON();
      } else {
        const newUser = new this.userModel(createUserDto);
        await newUser.save();
        return newUser.toJSON();
      }
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Get all users
  async findAll(): Promise<User[]> {
    return this.userModel.find().populate('company').exec();
  }

  // Get a specific user by ID
  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).populate('company').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user.toObject();
  }

  // Find user by email
  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel
      .findOne({ email })
      .populate('company')
      .exec();
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user.toObject();
  }

  // Update a user
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const updateData = { ...updateUserDto };

      // Handle password update
      if ('password' in updateUserDto) {
        const { password, ...rest } = updateData as any;
        const passwordHash = await bcrypt.hash(password, 10);
        Object.assign(updateData, { ...rest, passwordHash });
      }

      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('company')
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Update user permissions
  async updatePermissions(
    id: string,
    permissions: Partial<UserPermissions>,
  ): Promise<User> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, { permissions }, { new: true })
        .populate('company')
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Failed to update user permissions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Update user company
  async updateCompany(id: string, companyId: string): Promise<User> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, { company: companyId }, { new: true })
        .populate('company')
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Failed to update user company: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Delete a user
  async remove(id: string): Promise<void> {
    try {
      const result = await this.userModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete user: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Update the last login timestamp
  async updateLastLogin(id: string): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { lastLoginAt: new Date() }, { new: true })
      .exec();
  }
}
