import { Controller, Post, Get, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthorizationGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send invitation to a user' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully' })
  async createInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
    @Request() req: any
  ) {
    return this.invitationsService.createInvitation(createInvitationDto, req.user._id || req.user.id);
  }

  @Get(':token')
  @ApiOperation({ summary: 'Get invitation details by token' })
  @ApiResponse({ status: 200, description: 'Invitation details retrieved' })
  async getInvitationByToken(@Param('token') token: string) {
    return this.invitationsService.getInvitationByToken(token);
  }

  @Post(':token/accept')
  @ApiOperation({ summary: 'Accept invitation and create user account' })
  @ApiResponse({ status: 201, description: 'Invitation accepted and user created' })
  async acceptInvitation(
    @Param('token') token: string,
    @Body() acceptInvitationDto: AcceptInvitationDto
  ) {
    return this.invitationsService.acceptInvitation(token, acceptInvitationDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all invitations' })
  @ApiResponse({ status: 200, description: 'Invitations retrieved successfully' })
  async getInvitations(@Request() req: any) {
    // System admins can see all invitations, company owners only their company's
    const filters = req.user.role === Role.SYSTEM_ADMIN ? {} : { company: req.user.company };
    return this.invitationsService.getInvitations(filters);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel invitation' })
  @ApiResponse({ status: 200, description: 'Invitation cancelled successfully' })
  async cancelInvitation(@Param('id') id: string) {
    return this.invitationsService.cancelInvitation(id);
  }
}