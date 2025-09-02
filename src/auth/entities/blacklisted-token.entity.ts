import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlacklistedTokenDocument = BlacklistedToken & Document;

@Schema({
  timestamps: true,
  collection: 'blacklisted_tokens'
})
export class BlacklistedToken {
  @Prop({ required: true, unique: true })
  jti: string; // JWT ID

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ required: true, enum: ['access', 'refresh'] })
  tokenType: 'access' | 'refresh';

  @Prop({ default: Date.now })
  blacklistedAt: Date;
}

export const BlacklistedTokenSchema = SchemaFactory.createForClass(BlacklistedToken);

// Create TTL index to automatically remove expired tokens
BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });