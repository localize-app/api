import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateInvitationDto {
  @ApiProperty({ description: 'Email address of the person to invite' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Role to assign to the invited user',
    enum: Role,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @ApiProperty({ description: 'Company ID to invite the user to' })
  @IsMongoId()
  @IsNotEmpty()
  company: string;
}
