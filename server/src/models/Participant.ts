import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const participantSchema = new Schema(
  {
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // set when a guest creates an account
    displayName: { type: String, required: true, trim: true, maxlength: 30 },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    sessionTokenHash: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export type ParticipantDoc = InferSchemaType<typeof participantSchema> & { _id: Types.ObjectId };
export const Participant = model('Participant', participantSchema);
