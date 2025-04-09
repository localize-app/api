import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class AddTranslationDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsEnum(['pending', 'approved', 'rejected', 'needs_review'])
  @IsOptional()
  status?: string = 'pending';

  @IsBoolean()
  @IsOptional()
  isHuman?: boolean = true;
}
