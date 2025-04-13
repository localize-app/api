// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Create a new user
  async create(createUserDto: CreateUserDto): Promise<User> {
    // If the request has a password, store it as passwordHash
    if ('password' in createUserDto) {
      const { password, ...userData } = createUserDto;
      const newUser = new this.userModel({
        ...userData,
        passwordHash: password, // This should be pre-hashed when coming from auth service
      });
      return newUser.save();
    } else {
      const newUser = new this.userModel(createUserDto);
      return newUser.save();
    }
  }

  // Get all users
  async findAll(): Promise<User[]> {
    return this.userModel
      .find()
      .populate('companies') // Populate associated companies
      .exec();
  }

  // Get a specific user by ID
  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .populate('companies') // Populate associated companies
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user.toObject();
  }

  // Find user by email
  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user.toObject();
  }

  // Update a user
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .populate('companies') // Populate associated companies
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  // Delete a user
  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  // Update the last login timestamp
  async updateLastLogin(id: string): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { lastLoginAt: new Date() }, { new: true })
      .exec();
  }
}
