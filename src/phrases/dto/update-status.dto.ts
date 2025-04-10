import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'New status for the item',
    enum: ['published', 'pending', 'needs_review', 'rejected', 'archived'],
  })
  @IsEnum(['published', 'pending', 'needs_review', 'rejected', 'archived'])
  @IsNotEmpty()
  status: string;
}
