// src/companies/interfaces/company-with-users.interface.ts
import { Company } from '../entities/company.entity';
import { User } from 'src/users/entities/user.entity';

// Use a type intersection instead of extending
export type CompanyWithUsers = Company & {
  users: User[];
};
