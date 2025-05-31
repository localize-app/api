import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdatePermissionsDto } from 'src/users/dto/update-permissions.dto';

export class UpdateCompanyPermissionsDto {
  @ApiProperty({
    description: 'Default permissions for owners in this company',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePermissionsDto)
  ownerDefaults?: UpdatePermissionsDto;

  @ApiProperty({
    description: 'Default permissions for admins in this company',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePermissionsDto)
  adminDefaults?: UpdatePermissionsDto;

  @ApiProperty({
    description: 'Default permissions for managers in this company',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePermissionsDto)
  managerDefaults?: UpdatePermissionsDto;

  @ApiProperty({
    description: 'Default permissions for members in this company',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePermissionsDto)
  memberDefaults?: UpdatePermissionsDto;

  @ApiProperty({
    description: 'Default permissions for translators in this company',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePermissionsDto)
  translatorDefaults?: UpdatePermissionsDto;
}
