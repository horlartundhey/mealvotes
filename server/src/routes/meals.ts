import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { asyncHandler, HttpError } from '../lib/errors';
import { requireMember, requireOwner } from '../middleware/auth';
import { Household } from '../models/Household';
import { CATEGORIES, Meal, type MealDoc } from '../models/Meal';

export const mealRouter = Router({ mergeParams: true });

export const toPublic = (m: MealDoc, disabled: Set<string>) => ({
  id: String(m._id),
  name: m.name,
  description: m.description,
  category: m.category,
  mealType: m.mealType,
  prepMinutes: m.prepMinutes,
  estimatedCost: m.estimatedCost,
  tags: m.tags,
  image: m.image?.url ? { url: m.image.url, credit: m.image.credit, creditUrl: m.image.creditUrl, source: m.image.source } : null,
  isCustom: m.householdId != null,
  isActive: m.isActive && !disabled.has(String(m._id)),
});

const mealBody = z.object({
  name: z.string().trim().min(1, 'Meal name is required').max(80),
  description: z.string().trim().max(300).optional().default(''),
  category: z.enum(CATEGORIES),
  prepMinutes: z.number().int().min(1, 'Prep time must be at least 1 minute').max(600),
  estimatedCost: z.number().min(0).max(1_000_000),
  imageUrl: z.string().url().startsWith('https://', 'Image must be an https link').optional(),
});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function loadOwnMeal(householdId: unknown, mealId: string) {
  if (!isValidObjectId(mealId)) throw new HttpError(404, 'Meal not found');
  const meal = await Meal.findById(mealId);
  if (!meal || (meal.householdId && String(meal.householdId) !== String(householdId))) throw new HttpError(404, 'Meal not found');
  return meal;
}

mealRouter.get(
  '/',
  requireMember,
  asyncHandler(async (req, res) => {
    const household = req.household!;
    const meals = await Meal.find({ $or: [{ householdId: null }, { householdId: household._id }] })
      .sort({ category: 1, name: 1 })
      .lean<MealDoc[]>();
    const disabled = new Set((household.disabledMealIds ?? []).map(String));
    res.json({ meals: meals.map((m) => toPublic(m, disabled)) });
  }),
);

mealRouter.post(
  '/',
  requireMember,
  requireOwner,
  asyncHandler(async (req, res) => {
    const body = mealBody.parse(req.body);
    const meal = await Meal.create({
      householdId: req.household!._id,
      createdBy: req.me!._id,
      slug: `${slugify(body.name)}-${Date.now().toString(36)}`,
      name: body.name,
      description: body.description,
      category: body.category,
      prepMinutes: body.prepMinutes,
      estimatedCost: body.estimatedCost,
      image: body.imageUrl ? { url: body.imageUrl, source: 'manual' } : undefined,
    });
    res.status(201).json(toPublic(meal.toObject() as MealDoc, new Set()));
  }),
);

mealRouter.patch(
  '/:mealId',
  requireMember,
  requireOwner,
  asyncHandler(async (req, res) => {
    const meal = await loadOwnMeal(req.household!._id, req.params.mealId);
    if (!meal.householdId) throw new HttpError(403, 'Built-in meals can be switched off but not edited');
    const body = mealBody.partial().parse(req.body);
    const { imageUrl, ...rest } = body;
    meal.set(rest);
    if (imageUrl) meal.set('image', { url: imageUrl, source: 'manual' });
    await meal.save();
    res.json(toPublic(meal.toObject() as MealDoc, new Set()));
  }),
);

mealRouter.patch(
  '/:mealId/status',
  requireMember,
  requireOwner,
  asyncHandler(async (req, res) => {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
    const meal = await loadOwnMeal(req.household!._id, req.params.mealId);
    if (meal.householdId) {
      meal.isActive = isActive;
      await meal.save();
    } else {
      await Household.updateOne(
        { _id: req.household!._id },
        isActive ? { $pull: { disabledMealIds: meal._id } } : { $addToSet: { disabledMealIds: meal._id } },
      );
    }
    res.json({ id: String(meal._id), isActive });
  }),
);
