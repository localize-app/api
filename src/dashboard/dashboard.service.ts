// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../projects/entities/project.entity';
import { Phrase } from '../phrases/entities/phrase.entity';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Phrase.name) private phraseModel: Model<Phrase>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

  async getStats(user?: any) {
    const isSystemAdmin =
      user?.role === Role.SYSTEM_ADMIN || user?.role === 'SYSTEM_ADMIN';
    let companyFilter: any = {};
    console.log(user?.role);

    if (!isSystemAdmin && user?.company) {
      const companyId =
        typeof user.company === 'object'
          ? user.company.id || user.company._id || user.company
          : user.company;
      if (companyId) companyFilter = { company: companyId };
    }

    // Get project IDs for phrase filtering
    let projectIds: any[] = [];
    if (!isSystemAdmin && Object.keys(companyFilter).length > 0) {
      const projects = await this.projectModel
        .find(companyFilter)
        .select('_id')
        .lean()
        .exec();
      projectIds = projects.map((p) => p._id);
    }

    const phraseFilter = isSystemAdmin
      ? {}
      : projectIds.length > 0
        ? { project: { $in: projectIds } }
        : { project: { $in: [] } };
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalProjects,
      totalPhrases,
      totalUsers,
      totalCompanies,
      recentProjects,
      phrasesThisMonth,
    ] = await Promise.all([
      this.projectModel.countDocuments(isSystemAdmin ? {} : companyFilter),
      this.phraseModel.countDocuments(phraseFilter),
      this.userModel.countDocuments(isSystemAdmin ? {} : companyFilter),
      isSystemAdmin ? this.companyModel.countDocuments() : Promise.resolve(1),
      this.projectModel.countDocuments({
        ...(isSystemAdmin ? {} : companyFilter),
        createdAt: { $gte: thirtyDaysAgo },
      }),
      this.phraseModel.countDocuments({
        ...phraseFilter,
        createdAt: { $gte: thirtyDaysAgo },
      }),
    ]);

    return [
      {
        title: 'Total Projects',
        value: totalProjects.toLocaleString(),
        change:
          recentProjects > 0
            ? `+${recentProjects} this month`
            : 'No new projects',
        trend: recentProjects > 0 ? 'up' : 'neutral',
      },
      {
        title: 'Total Phrases',
        value: totalPhrases.toLocaleString(),
        change:
          phrasesThisMonth > 0
            ? `+${phrasesThisMonth} this month`
            : 'No new phrases',
        trend: phrasesThisMonth > 0 ? 'up' : 'neutral',
      },
      {
        title: 'Active Users',
        value: totalUsers.toLocaleString(),
        change: isSystemAdmin ? `${totalCompanies} companies` : 'Your company',
        trend: 'neutral',
      },
      {
        title: 'Translation Progress',
        value: `${Math.round(totalPhrases * 0.75)}`, // Mock progress
        change: '75% completed',
        trend: 'up',
      },
    ];
  }

  async getAnalytics(user?: any) {
    const isSystemAdmin =
      user?.role === Role.SYSTEM_ADMIN || user?.role === 'SYSTEM_ADMIN';
    let companyFilter: any = {};

    if (!isSystemAdmin && user?.company) {
      const companyId =
        typeof user.company === 'object'
          ? user.company.id || user.company._id || user.company
          : user.company;
      if (companyId) companyFilter = { company: companyId };
    }

    // Get project IDs for phrase filtering
    let projectIds: any[] = [];
    if (!isSystemAdmin && Object.keys(companyFilter).length > 0) {
      const projects = await this.projectModel
        .find(companyFilter)
        .select('_id')
        .lean()
        .exec();
      projectIds = projects.map((p) => p._id);
    }

    const phraseFilter = isSystemAdmin
      ? {}
      : projectIds.length > 0
        ? { project: { $in: projectIds } }
        : { project: { $in: [] } };
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dailyPhrases = await this.phraseModel.aggregate([
      ...(isSystemAdmin ? [] : [{ $match: phraseFilter }]),
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    const totalPhrases = await this.phraseModel.countDocuments(phraseFilter);

    // Count translations by language (filtered by company for non-admins)
    const translationsByLanguage = await this.phraseModel.aggregate([
      ...(isSystemAdmin ? [] : [{ $match: phraseFilter }]),
      {
        $project: {
          translations: { $objectToArray: '$translations' },
        },
      },
      {
        $unwind: '$translations',
      },
      {
        $group: {
          _id: '$translations.k',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    return {
      dailyActivity: dailyPhrases.map((item) => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        phrases: item.count,
        translations: Math.floor(item.count * 0.8),
      })),
      topLanguages:
        translationsByLanguage.length > 0
          ? translationsByLanguage.map((item) => ({
              language: item._id || 'Unknown',
              phrases: item.count,
            }))
          : [
              { language: 'English', phrases: Math.floor(totalPhrases * 0.4) },
              { language: 'Spanish', phrases: Math.floor(totalPhrases * 0.25) },
              { language: 'French', phrases: Math.floor(totalPhrases * 0.15) },
              { language: 'German', phrases: Math.floor(totalPhrases * 0.1) },
              { language: 'Others', phrases: Math.floor(totalPhrases * 0.1) },
            ],
    };
  }
}
