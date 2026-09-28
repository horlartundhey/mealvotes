import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, ErrorNote, Field, Loading, Logo, Page, Panel } from '../components/ui';

export default function Join() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');

  const invite = useQuery({ queryKey: ['invite', token], queryFn: () => api.getInvite(token) });
  const join = useMutation({
    mutationFn: () => api.join(token, displayName),
    onSuccess: (r) => navigate(`/household/${r.householdId}`),
  });

  if (invite.isLoading) return <Page><Loading /></Page>;

  if (invite.isError) {
    return (
      <Page>
        <Panel>
          <h1 className="font-display text-2xl font-extrabold">Hmm, this link is dead 🪦</h1>
          <p className="mt-2 mb-5">{invite.error.message}</p>
          <Link to="/" className="font-bold underline">Back home</Link>
        </Panel>
      </Page>
    );
  }

  // Already joined from this browser: skip straight in.
  if (invite.data?.me) return <Navigate to={`/household/${invite.data.household.id}`} replace />;

  const { household, memberCount } = invite.data!;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    join.mutate();
  };

  return (
    <Page>
      <div className="mb-6">
        <Logo />
      </div>
      <Panel>
        <p className="font-display text-sm font-extrabold tracking-wide text-pepper uppercase">You've been invited</p>
        <h1 className="font-display mt-1 text-3xl leading-tight font-extrabold tracking-tight">{household.name}</h1>
        <p className="mt-2 mb-5">
          {memberCount === 1 ? '1 person is' : `${memberCount} people are`} already in. Pick a name so everyone knows who voted.
        </p>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Your name" placeholder="Tunde" value={displayName} maxLength={30} onChange={(e) => setDisplayName(e.target.value)} required autoFocus />
          {join.error && <ErrorNote message={join.error.message} />}
          <Button type="submit" variant="secondary" disabled={join.isPending}>
            {join.isPending ? 'Pulling up a chair…' : 'Join & see today’s meals'}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs font-medium">No password. No email. No account.</p>
      </Panel>
    </Page>
  );
}
