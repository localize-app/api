import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  // Create a new company
  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const newCompany = new this.companyModel(createCompanyDto);
    return newCompany.save();
  }

  // Get all companies
  async findAll(): Promise<Company[]> {
    return this.companyModel
      .find()
      .populate('projects') // Populate projects
      .populate('users') // Populate users
      .exec();
  }

  // Get a specific company by ID
  async findOne(id: string): Promise<Company> {
    const company = await this.companyModel
      .findById(id)
      .populate('projects') // Populate projects
      .populate('users') // Populate users
      .exec();
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  // Update a company
  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const updatedCompany = await this.companyModel
      .findByIdAndUpdate(id, updateCompanyDto, { new: true })
      .populate('projects') // Populate projects
      .populate('users') // Populate users
      .exec();
    if (!updatedCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return updatedCompany;
  }

  // Delete a company
  async remove(id: string): Promise<void> {
    const result = await this.companyModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
  }
}
