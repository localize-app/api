import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcrypt';
import {
  Invitation,
  InvitationDocument,
  InvitationStatus,
} from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { User, UserDocument } from '../users/entities/user.entity';
import { Company, CompanyDocument } from '../companies/entities/company.entity';

@Injectable()
export class InvitationsService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Invitation.name)
    private invitationModel: Model<InvitationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {
    // Configure email transporter - using Gmail as free option
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Set in your .env file
        pass: process.env.EMAIL_PASS, // App password, not regular password
      },
    });
  }

  async createInvitation(
    createInvitationDto: CreateInvitationDto,
    invitedById: string,
  ): Promise<Invitation> {
    const { email, role, company } = createInvitationDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.invitationModel.findOne({
      email,
      status: InvitationStatus.PENDING,
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      throw new BadRequestException(
        'Pending invitation already exists for this email',
      );
    }

    // Verify company exists
    const companyExists = await this.companyModel.findById(company);
    if (!companyExists) {
      throw new BadRequestException('Company not found');
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = new this.invitationModel({
      email,
      token,
      role,
      company,
      invitedBy: invitedById,
      expiresAt,
    });

    const savedInvitation = await invitation.save();
    await savedInvitation.populate(['company', 'invitedBy']);

    // Send invitation email
    await this.sendInvitationEmail(savedInvitation);

    return savedInvitation;
  }

  async getInvitationByToken(token: string): Promise<Invitation> {
    const invitation = await this.invitationModel
      .findOne({
        token,
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() },
      })
      .populate(['company', 'invitedBy']);

    if (!invitation) {
      throw new NotFoundException('Invitation not found or expired');
    }

    return invitation;
  }

  async acceptInvitation(
    token: string,
    acceptInvitationDto: AcceptInvitationDto,
  ): Promise<User> {
    const invitation = await this.getInvitationByToken(token);
    const { firstName, lastName, password } = acceptInvitationDto;

    // Check if user already exists (double-check)
    const existingUser = await this.userModel.findOne({
      email: invitation.email,
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new this.userModel({
      email: invitation.email,
      firstName,
      lastName,
      passwordHash: hashedPassword,
      role: invitation.role,
      company: invitation.company,
    });

    const savedUser = await newUser.save();

    // Mark invitation as accepted
    await this.invitationModel.findByIdAndUpdate((invitation as any)._id, {
      status: InvitationStatus.ACCEPTED,
      acceptedBy: savedUser._id,
      acceptedAt: new Date(),
    });

    // Populate user data
    await savedUser.populate('company');

    return savedUser;
  }

  async cancelInvitation(id: string): Promise<void> {
    const invitation = await this.invitationModel.findById(id);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    invitation.status = InvitationStatus.CANCELLED;
    await invitation.save();
  }

  async getInvitations(filters: any = {}): Promise<Invitation[]> {
    return this.invitationModel
      .find(filters)
      .populate(['company', 'invitedBy', 'acceptedBy'])
      .sort({ createdAt: -1 });
  }

  private async sendInvitationEmail(invitation: any): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const invitationUrl = `${frontendUrl}/accept-invitation/${invitation.token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: invitation.email,
      subject: `You've been invited to join ${invitation.company.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to join ${invitation.company.name}</h2>
          <p>Hello,</p>
          <p>${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName} has invited you to join <strong>${invitation.company.name}</strong> as a <strong>${invitation.role.toLowerCase()}</strong>.</p>
          <p>To accept this invitation and create your account, click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #722ed1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
          <p><strong>This invitation will expire in 7 days.</strong></p>
          <hr>
          <p style="color: #666; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Invitation email sent successfully to:', invitation.email);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't throw error - invitation is still created
    }
  }

  async resendInvitation(
    invitationId: string,
    _resendById: string,
  ): Promise<Invitation> {
    const invitation = await this.invitationModel
      .findById(invitationId)
      .populate(['company', 'invitedBy']);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Can only resend pending invitations');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    // Check if user already exists (they may have been created after invitation)
    const existingUser = await this.userModel.findOne({
      email: invitation.email,
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Generate new token and extend expiration
    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    invitation.token = newToken;
    invitation.expiresAt = newExpiresAt;

    const updatedInvitation = await invitation.save();

    // Send invitation email with new token
    await this.sendInvitationEmail(updatedInvitation);

    return updatedInvitation;
  }
}
