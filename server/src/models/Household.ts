import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const householdSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    ownerParticipantId: { type: Schema.Types.ObjectId, ref: 'Participant' },
    inviteToken: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    // Global library meals this household has switched off (the shared meal doc is never modified).
    disabledMealIds: { type: [Schema.Types.ObjectId], default: [] },
    settings: {
      cooldownDays: { type: Number, default: 5 },
      closeHour: { type: Number, default: 12 }, // 12:00 Africa/Lagos
      lateStartHour: { type: Number, default: 11 },
      timezone: { type: String, default: 'Africa/Lagos' },
    },
  },
  { timestamps: true },
);

export type HouseholdDoc = InferSchemaType<typeof householdSchema> & { _id: Types.ObjectId };
export const Household = model('Household', householdSchema);
