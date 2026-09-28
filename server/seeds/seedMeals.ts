import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import '../src/lib/env';
import { connectDb } from '../src/lib/db';
import { Meal } from '../src/models/Meal';

interface SeedMeal {
  slug: string;
  name: string;
  category: string;
  prepMinutes: number;
  estimatedCost: number;
  tags: string[];
  description: string;
}
interface ImageEntry {
  url: string;
  credit?: string;
  creditUrl?: string;
  source: string;
  license?: string;
}

const read = <T>(file: string, fallback: T): T => {
  const p = path.join(__dirname, file);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback;
};

/** Idempotent: safe to re-run. Never overwrites an owner's isActive choice. */
export async function seedMeals() {
  const meals = read<SeedMeal[]>('meals.json', []);
  const images = read<Record<string, ImageEntry>>('images.json', {});

  const ops = meals.map((m) => ({
    updateOne: {
      filter: { householdId: null, slug: m.slug },
      update: {
        $set: {
          name: m.name,
          description: m.description,
          category: m.category,
          prepMinutes: m.prepMinutes,
          estimatedCost: m.estimatedCost,
          tags: m.tags,
          ...(images[m.slug] ? { image: images[m.slug] } : {}),
        },
        // A photo removed from images.json should disappear from the library too.
        ...(images[m.slug] ? {} : { $unset: { image: '' } }),
        $setOnInsert: { householdId: null, slug: m.slug, mealType: 'major', cuisine: 'nigerian', isActive: true },
      },
      upsert: true,
    },
  }));
  const result = await Meal.bulkWrite(ops as never);
  return { total: meals.length, inserted: result.upsertedCount, updated: result.modifiedCount, withImages: Object.keys(images).length };
}

if (require.main === module) {
  connectDb()
    .then(seedMeals)
    .then((r) => console.log('Seeded meals:', r))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
