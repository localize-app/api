import { PartialType } from '@nestjs/mapped-types';
import { CreateStyleGuideDto } from './create-style-guide.dto';

export class UpdateStyleGuideDto extends PartialType(CreateStyleGuideDto) {}
