import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../users/entities/user.entity';
import { Company, CompanyDocument } from '../companies/entities/company.entity';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async setupDatabase(): Promise<void> {
    this.logger.log('Starting database setup...');

    try {
      // Check if setup already exists
      const existingAdmin = await this.userModel.findOne({
        role: Role.SYSTEM_ADMIN,
      });
      if (existingAdmin) {
        this.logger.log('Setup already exists. Skipping...');
        return;
      }

      // Create default company
      const defaultCompany = await this.createDefaultCompany();
      this.logger.log(`Created default company: ${defaultCompany.name}`);

      // Create system admin user
      const adminUser = await this.createSystemAdmin();
      this.logger.log(`Created system admin: ${adminUser.email}`);

      this.logger.log('Database setup completed successfully!');
      this.logger.log('='.repeat(50));
      this.logger.log('DEFAULT CREDENTIALS:');
      this.logger.log('Email: admin@insta-lang.io');
      this.logger.log('Password: admin123');
      this.logger.log('='.repeat(50));
    } catch (error) {
      this.logger.error('Database setup failed:', error);
      throw error;
    }
  }

  private async createDefaultCompany(): Promise<Company> {
    const companyData = {
      name: 'instaLang',
      description: 'InstaLang for development and testing',
      isActive: true,
      maxProjects: 100,
      maxTeamMembers: 100,
    };

    const company = new this.companyModel(companyData);
    return company.save();
  }

  private async createSystemAdmin(): Promise<User> {
    const password = 'admin123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const userData = {
      email: 'admin@insta-lang.io',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.SYSTEM_ADMIN,
    };

    const user = new this.userModel(userData);
    return user.save();
  }

  async resetDatabase(): Promise<void> {
    this.logger.log('Resetting database...');

    try {
      // Clear all collections
      await this.userModel.deleteMany({});
      await this.companyModel.deleteMany({});

      this.logger.log('Database cleared successfully');

      // Run setup again
      await this.setupDatabase();
    } catch (error) {
      this.logger.error('Database reset failed:', error);
      throw error;
    }
  }
}
