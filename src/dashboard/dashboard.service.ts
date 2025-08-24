// src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../projects/entities/project.entity';
import { Phrase } from '../phrases/entities/phrase.entity';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Phrase.name) private phraseModel: Model<Phrase>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

  async getStats() {
    const [
      totalProjects,
      totalPhrases,
      totalUsers,
      totalCompanies,
      recentProjects,
      phrasesThisMonth,
    ] = await Promise.all([
      this.projectModel.countDocuments(),
      this.phraseModel.countDocuments(),
      this.userModel.countDocuments(),
      this.companyModel.countDocuments(),
      this.projectModel.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      this.phraseModel.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
    ]);

    return [
      {
        title: 'Total Projects',
        value: totalProjects.toLocaleString(),
        change: recentProjects > 0 ? `+${recentProjects} this month` : 'No new projects',
        trend: recentProjects > 0 ? 'up' : 'neutral'
      },
      {
        title: 'Total Phrases',
        value: totalPhrases.toLocaleString(),
        change: phrasesThisMonth > 0 ? `+${phrasesThisMonth} this month` : 'No new phrases',
        trend: phrasesThisMonth > 0 ? 'up' : 'neutral'
      },
      {
        title: 'Active Users',
        value: totalUsers.toLocaleString(),
        change: `${totalCompanies} companies`,
        trend: 'neutral'
      },
      {
        title: 'Translation Progress',
        value: `${Math.round((totalPhrases * 0.75))}`, // Mock progress
        change: '75% completed',
        trend: 'up'
      }
    ];
  }

  async getAnalytics() {
    // Generate mock analytics data for charts
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const dailyPhrases = await this.phraseModel.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const totalPhrases = await this.phraseModel.countDocuments();

    return {
      dailyActivity: dailyPhrases.map(item => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        phrases: item.count,
        translations: Math.floor(item.count * 0.8), // Mock translation count
      })),
      topLanguages: [
        { language: 'English', phrases: Math.floor(totalPhrases * 0.4) },
        { language: 'Spanish', phrases: Math.floor(totalPhrases * 0.25) },
        { language: 'French', phrases: Math.floor(totalPhrases * 0.15) },
        { language: 'German', phrases: Math.floor(totalPhrases * 0.1) },
        { language: 'Others', phrases: Math.floor(totalPhrases * 0.1) }
      ]
    };
  }
}