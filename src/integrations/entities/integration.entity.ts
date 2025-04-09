import { Prop, Schema } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Project } from 'src/projects/entities/project.entity';

// integrations/entities/integration.entity.ts
@Schema({
  timestamps: true,
})
export class Integration {
  @Prop({ required: true })
  type: string; // 'google_analytics', 'heap', 'mixpanel', etc.

  @Prop({ required: true })
  name: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  config: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project' })
  project: Project;

  @Prop({ default: false })
  isEnabled: boolean;
}
