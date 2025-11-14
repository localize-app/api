// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';
import { Role } from 'src/common/enums/role.enum';
import { UserPermissions } from './entities/user-permissions.entity';
import { RolePermissionsService } from 'src/auth/role-permission.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private rolePermissionsService: RolePermissionsService,
  ) {}

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

        // Create default permissions for the role
        const defaultPermissions =
          this.rolePermissionsService.createDefaultPermissions(userRole);

        const newUser = new this.userModel({
          ...userData,
          passwordHash,
          role: userRole,
          permissions: defaultPermissions,
          hasCustomPermissions: false,
          permissionsLastUpdated: new Date(),
        });

        await newUser.save();
        return newUser.toJSON();
      } else {
        // Create default permissions for member role
        const defaultPermissions =
          this.rolePermissionsService.createDefaultPermissions(Role.MEMBER);

        const newUser = new this.userModel({
          ...createUserDto,
          permissions: defaultPermissions,
          hasCustomPermissions: false,
          permissionsLastUpdated: new Date(),
        });
        await newUser.save();
        return newUser.toJSON();
      }
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Get all users
  async findAll(filters: any = {}): Promise<User[]> {
    return this.userModel.find(filters).populate('company').exec();
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

      // Handle role change - update permissions to new role defaults if not customized
      if ('role' in updateUserDto && updateUserDto.role) {
        const currentUser = await this.userModel.findById(id).exec();
        if (!currentUser) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }

        // If role is changing and user doesn't have custom permissions, update to new role defaults
        if (
          currentUser.role !== updateUserDto.role &&
          !currentUser.hasCustomPermissions
        ) {
          const newDefaultPermissions =
            this.rolePermissionsService.createDefaultPermissions(
              updateUserDto.role,
            );
          Object.assign(updateData, {
            permissions: newDefaultPermissions,
            permissionsLastUpdated: new Date(),
          });
        }
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

  // Update user permissions (NEW METHOD)
  async updatePermissions(
    id: string,
    permissions: Partial<UserPermissions>,
  ): Promise<User> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Merge with existing permissions
      const currentPermissions =
        user.permissions ||
        this.rolePermissionsService.createDefaultPermissions(user.role);
      const updatedPermissions = { ...currentPermissions, ...permissions };

      // Check if permissions are customized from role defaults
      const hasCustomPermissions =
        this.rolePermissionsService.hasCustomizedPermissions(
          updatedPermissions,
          user.role,
        );

      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          {
            permissions: updatedPermissions,
            hasCustomPermissions,
            permissionsLastUpdated: new Date(),
          },
          { new: true },
        )
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

  // SECURITY: Increment token version to invalidate all user sessions
  async incrementTokenVersion(id: string): Promise<User> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } }, { new: true })
        .populate('company')
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(
        `Token version incremented for user ${id}, new version: ${updatedUser.tokenVersion}`,
      );
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Failed to increment token version: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Reset user permissions to role defaults (NEW METHOD)
  async resetPermissionsToRoleDefaults(id: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const defaultPermissions =
        this.rolePermissionsService.createDefaultPermissions(user.role);

      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          id,
          {
            permissions: defaultPermissions,
            hasCustomPermissions: false,
            permissionsLastUpdated: new Date(),
          },
          { new: true },
        )
        .populate('company')
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Failed to reset user permissions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Get effective permissions for a user (NEW METHOD)
  async getEffectivePermissions(id: string): Promise<UserPermissions> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return this.rolePermissionsService.getEffectivePermissions(
        user.permissions,
        user.role,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get user permissions: ${error.message}`,
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

  // Password reset functionality
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      // For security, don't reveal if email exists or not
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send reset email
    await this.sendPasswordResetEmail(user, resetToken);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear reset token
    user.passwordHash = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.tokenVersion += 1; // Invalidate all existing sessions
    await user.save();

    return { message: 'Password reset successfully' };
  }

  private async sendPasswordResetEmail(
    user: User,
    resetToken: string,
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.firstName},</p>
          <p>You requested a password reset for your account. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #722ed1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <hr>
          <p style="color: #666; font-size: 12px;">If you didn't request this password reset, you can safely ignore this email.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully to:', user.email);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}
