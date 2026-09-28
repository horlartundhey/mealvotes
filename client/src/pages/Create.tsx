import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, ErrorNote, Field, Logo, Page, Panel } from '../components/ui';

export default function Create() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const create = useMutation({
    mutationFn: () => api.createHousehold(name, ownerName),
    onSuccess: (h) => navigate(`/household/${h.id}`, { state: { justCreated: true } }),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <Page>
      <div className="mb-6">
        <Logo />
      </div>
      <Panel>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Who are we feeding?</h1>
        <p className="mt-1 mb-5">Name your household, then invite the people you eat with.</p>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Household name" placeholder="The Ibitoye Household" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required />
          <Field label="Your name" placeholder="Olatunde" value={ownerName} maxLength={30} onChange={(e) => setOwnerName(e.target.value)} required />
          {create.error && <ErrorNote message={create.error.message} />}
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Lighting the stove…' : 'Create household'}
          </Button>
        </form>
      </Panel>
    </Page>
  );
}
