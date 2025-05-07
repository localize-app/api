import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum PhraseStatus {
  PUBLISHED = 'published',
  PENDING = 'pending',
  NEEDS_REVIEW = 'needs_review',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

export class UpdateStatusDto {
  @ApiProperty({
    description: 'New status for the phrase',
    enum: PhraseStatus,
    example: PhraseStatus.PUBLISHED,
  })
  @IsEnum(PhraseStatus)
  @IsNotEmpty()
  status: PhraseStatus;
}
