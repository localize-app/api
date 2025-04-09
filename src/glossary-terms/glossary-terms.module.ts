import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GlossaryTermsService } from './glossary-terms.service';
import { GlossaryTermsController } from './glossary-terms.controller';
import {
  GlossaryTerm,
  GlossaryTermSchema,
} from './entities/glossary-term.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GlossaryTerm.name, schema: GlossaryTermSchema },
    ]),
  ],
  controllers: [GlossaryTermsController],
  providers: [GlossaryTermsService],
  exports: [GlossaryTermsService],
})
export class GlossaryTermsModule {}
