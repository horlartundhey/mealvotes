import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export const CATEGORIES = ['rice', 'beans', 'swallow', 'yam', 'plantain', 'pasta', 'porridge', 'other'] as const;

const mealSchema = new Schema(
  {
    // null = part of the global seeded library; otherwise a custom meal owned by one household.
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', default: null, index: true },
    slug: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 300 },
    category: { type: String, enum: CATEGORIES, required: true },
    mealType: { type: String, enum: ['major', 'light'], default: 'major' },
    cuisine: { type: String, default: 'nigerian' },
    prepMinutes: { type: Number, required: true, min: 1 },
    estimatedCost: { type: Number, required: true, min: 0 },
    tags: { type: [String], default: [] },
    image: {
      url: String,
      credit: String,
      creditUrl: String,
      source: String, // 'unsplash' | 'wikimedia' | 'upload' | 'manual'
      license: String,
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Participant', default: null },
  },
  { timestamps: true },
);

mealSchema.index({ householdId: 1, slug: 1 }, { unique: true });

export type MealDoc = InferSchemaType<typeof mealSchema> & { _id: Types.ObjectId };
export const Meal = model('Meal', mealSchema);
