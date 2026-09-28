import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Meal, type NewMeal } from '../lib/api';
import { categoryMeta, type Category } from '../lib/theme';
import { ChopCard } from '../components/ChopCard';
import { Button, ErrorNote, Field, Loading, Logo, Page, Panel } from '../components/ui';

const categories = Object.keys(categoryMeta) as Category[];

export default function MealLibrary() {
  const { householdId = '' } = useParams();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [adding, setAdding] = useState(false);

  const household = useQuery({ queryKey: ['household', householdId], queryFn: () => api.getHousehold(householdId) });
  const meals = useQuery({ queryKey: ['meals', householdId], queryFn: () => api.getMeals(householdId) });
  const isOwner = household.data?.me.role === 'owner';

  const toggle = useMutation({
    mutationFn: (m: Meal) => api.setMealActive(householdId, m.id, !m.isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meals', householdId] }),
  });

  const visible = useMemo(
    () => (meals.data?.meals ?? []).filter((m) => filter === 'all' || m.category === filter),
    [meals.data, filter],
  );
  const activeCount = meals.data?.meals.filter((m) => m.isActive).length ?? 0;

  if (meals.isLoading) return <Page wide><Loading /></Page>;
  if (meals.error) return <Page wide><Panel>{meals.error.message}</Panel></Page>;

  return (
    <Page wide>
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <Link to={`/household/${householdId}`} className="text-sm font-bold underline">← Back</Link>
      </div>

      <h1 className="font-display text-4xl font-extrabold tracking-tight">Meal library</h1>
      <p className="mb-5 font-bold">
        {activeCount} meals in the pot{isOwner ? ' · switch off anything you never want suggested' : ''}
      </p>

      {isOwner && (
        <div className="mb-5">
          {adding ? (
            <AddMeal householdId={householdId} onDone={() => setAdding(false)} />
          ) : (
            <Button variant="secondary" onClick={() => setAdding(true)}>+ Add your own meal</Button>
          )}
        </div>
      )}

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-2">
        {(['all', ...categories] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            aria-pressed={filter === c}
            className={`font-display shrink-0 cursor-pointer rounded-full border-[3px] border-char px-4 py-1.5 text-sm font-extrabold ${
              filter === c ? 'bg-char text-plantain' : 'bg-white'
            }`}
          >
            {c === 'all' ? 'All' : categoryMeta[c].label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((m, i) => (
          <div key={m.id} className="grid gap-2">
            <ChopCard
              meal={{ ...m, imageUrl: m.image?.url }}
              letter={m.isCustom ? '★' : String(i + 1)}
              dimmed={!m.isActive}
            />
            {m.image?.credit && (
              <p className="px-1 text-xs">
                Photo: {m.image.creditUrl ? <a className="underline" href={m.image.creditUrl} target="_blank" rel="noreferrer">{m.image.credit}</a> : m.image.credit}
              </p>
            )}
            {isOwner && (
              <button
                onClick={() => toggle.mutate(m)}
                disabled={toggle.isPending}
                className={`font-display cursor-pointer rounded-xl border-[3px] border-char px-3 py-1.5 text-sm font-extrabold ${
                  m.isActive ? 'bg-white' : 'bg-ugu text-white'
                }`}
              >
                {m.isActive ? 'Switch off' : 'Switch back on'}
              </button>
            )}
          </div>
        ))}
      </div>
    </Page>
  );
}

function AddMeal({ householdId, onDone }: { householdId: string; onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', category: 'other' as Category, prepMinutes: '45', estimatedCost: '6000', imageUrl: '' });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const add = useMutation({
    mutationFn: () => {
      const meal: NewMeal = {
        name: form.name,
        category: form.category,
        prepMinutes: Number(form.prepMinutes),
        estimatedCost: Number(form.estimatedCost),
        ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
      };
      return api.addMeal(householdId, meal);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals', householdId] });
      onDone();
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    add.mutate();
  };

  return (
    <Panel>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Meal name" value={form.name} onChange={set('name')} placeholder="Mama's special stew" maxLength={80} required />
        <label className="block">
          <span className="font-display mb-1.5 block text-sm font-extrabold tracking-wide uppercase">Category</span>
          <select value={form.category} onChange={set('category')} className="w-full rounded-2xl border-[3px] border-char bg-white px-4 py-3 text-lg">
            {categories.map((c) => <option key={c} value={c}>{categoryMeta[c].label}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prep (min)" type="number" min={1} value={form.prepMinutes} onChange={set('prepMinutes')} required />
          <Field label="Cost (₦)" type="number" min={0} value={form.estimatedCost} onChange={set('estimatedCost')} required />
        </div>
        <Field label="Photo link (optional)" type="url" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" />
        {add.error && <ErrorNote message={add.error.message} />}
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
          <Button type="submit" disabled={add.isPending}>{add.isPending ? 'Adding…' : 'Add meal'}</Button>
        </div>
      </form>
    </Panel>
  );
}
