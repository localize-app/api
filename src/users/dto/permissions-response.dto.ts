import { ApiProperty } from '@nestjs/swagger';
import { UserPermissions } from '../entities/user-permissions.entity';

export class PermissionsResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiProperty({
    description: 'Whether permissions are customized from role defaults',
  })
  hasCustomPermissions: boolean;

  @ApiProperty({ description: 'When permissions were last updated' })
  permissionsLastUpdated: Date;

  @ApiProperty({ description: 'Effective permissions for the user' })
  permissions: UserPermissions;

  @ApiProperty({ description: 'Default permissions for the user role' })
  roleDefaults: UserPermissions;
}
