// style-guides/entities/style-guide.entity.ts
import * as mongoose from 'mongoose';
import { Prop, Schema } from '@nestjs/mongoose';
import { Project } from 'src/projects/entities/project.entity';

@Schema({
  timestamps: true,
})
export class StyleGuide {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project' })
  project: Project;

  @Prop()
  businessDescription?: string;

  @Prop()
  audienceDescription?: string;

  @Prop({
    enum: ['business', 'formal', 'informal', 'friendly'],
    default: 'business',
  })
  tone: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  sections: Record<string, any>;
}

export type StyleGuideSchema = mongoose.HydratedDocument<StyleGuide>;
