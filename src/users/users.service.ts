import { Injectable, NotFoundException } from '@nestjs/common';
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
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Create a new user
  async create(createUserDto: CreateUserDto): Promise<User> {
    // If the request has a password, hash it before storing as passwordHash
    if (createUserDto?.password) {
      const { password, permissions, role, ...userData } = createUserDto;

      // Hash the password if it hasn't been hashed already
      const passwordHash =
        password.startsWith('$2') && password.length > 50
          ? password // Already hashed
          : await bcrypt.hash(password, 10); // Hash it now

      // Determine role and permissions
      const userRole = role || Role.MEMBER;

      // If permissions are provided, use them; otherwise, get defaults for the role
      const userPermissions =
        permissions || getDefaultPermissionsForRole(userRole);

      const newUser = new this.userModel({
        ...userData,
        passwordHash,
        role: userRole,
        permissions: userPermissions,
      });

      return newUser.save();
    } else {
      const newUser = new this.userModel(createUserDto);
      return newUser.save();
    }
  }

  // Get all users
  async findAll(): Promise<User[]> {
    return this.userModel.find().populate('companies').exec();
  }

  // Get a specific user by ID
  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).populate('companies').exec();
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
    const updateData = { ...updateUserDto };

    // Handle password update
    if ('password' in updateUserDto) {
      const { password, ...rest } = updateData as any;
      const passwordHash = await bcrypt.hash(password, 10);
      Object.assign(updateData, { ...rest, passwordHash });
    }

    // Handle role change - update permissions if role changes and permissions aren't specified
    if (updateUserDto?.role && !updateUserDto?.permissions) {
      updateData.permissions = getDefaultPermissionsForRole(updateUserDto.role);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('companies')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  // Update user permissions
  async updatePermissions(
    id: string,
    permissions: Partial<UserPermissions>,
  ): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { permissions }, { new: true })
      .populate('companies')
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
