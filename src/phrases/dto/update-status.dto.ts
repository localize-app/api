import { IsNotEmpty, IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['published', 'pending', 'needs_review', 'rejected', 'archived'])
  @IsNotEmpty()
  status: string;
}
