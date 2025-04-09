// src/glossary/dto/add-translation.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class AddTranslationDto {
  @IsString()
  @IsNotEmpty()
  translation: string;
}
