import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ApiError, api } from '../lib/api';
import { StatsPanel, TodayCard } from '../components/HomePanels';
import { Token } from '../components/Token';
import { Button, Loading, Logo, Page, Panel } from '../components/ui';

const greeting = () => {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Africa/Lagos' }).format(new Date()));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function Dashboard() {
  const { householdId = '' } = useParams();
  const location = useLocation();
  const qc = useQueryClient();
  const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated);

  const { data, isLoading, error } = useQuery({
    queryKey: ['household', householdId],
    queryFn: () => api.getHousehold(householdId),
    refetchInterval: 15_000, // members appear as they join
  });

  const remove = useMutation({
    mutationFn: (memberId: string) => api.removeMember(householdId, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household', householdId] }),
  });

  if (isLoading) return <Page><Loading /></Page>;
  if (error instanceof ApiError && error.status === 401) return <Navigate to="/" replace />;
  if (error || !data) return <Page><Panel>{error?.message ?? 'Household not found'}</Panel></Page>;

  const isOwner = data.me.role === 'owner';

  return (
    <Page>
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <Link to="/preview" className="text-sm font-bold underline">Design preview</Link>
      </div>

      <h1 className="font-display text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
        {greeting()}, {data.me.displayName} 👋
      </h1>
      <p className="mb-6 font-bold">{data.name}</p>

      {isOwner && data.inviteUrl && <InviteCard path={data.inviteUrl} householdName={data.name} celebrate={justCreated} />}

      <div className="mt-6">
        <TodayCard householdId={householdId} />
      </div>

      <StatsPanel householdId={householdId} />

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link to={`/household/${householdId}/meals`} className="chunk font-display block rounded-2xl bg-ugu px-3 py-3.5 text-center text-base font-extrabold text-white">
          {isOwner ? 'Meal library' : 'Browse meals'} 🍛
        </Link>
        <Link to={`/household/${householdId}/history`} className="chunk font-display block rounded-2xl bg-palmoil px-3 py-3.5 text-center text-base font-extrabold">
          Chop log 📖
        </Link>
      </div>

      <Panel className="mt-6">
        <h2 className="font-display mb-3 text-xl font-extrabold">Around the table · {data.members.length}</h2>
        <ul className="grid gap-3">
          {data.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <Token name={m.displayName} />
              <span className="flex-1 text-lg font-bold">
                {m.displayName} {m.role === 'owner' && <span title="Owner">👑</span>}
                {m.id === data.me.id && <span className="ml-1 text-sm font-medium">(you)</span>}
              </span>
              {isOwner && m.role !== 'owner' && (
                <button
                  className="cursor-pointer text-sm font-bold text-pepper-deep underline disabled:opacity-50"
                  disabled={remove.isPending}
                  onClick={() => confirm(`Remove ${m.displayName}?`) && remove.mutate(m.id)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </Panel>
    </Page>
  );
}

function InviteCard({ path, householdName, celebrate }: { path: string; householdName: string; celebrate: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${path}`;
  const message = `Join ${householdName} on MealVote and vote for today's meal: ${url}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy your invite link:', url);
    }
  };

  const share = () =>
    navigator.share
      ? navigator.share({ title: 'MealVote', text: message, url }).catch(() => undefined)
      : window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener');

  return (
    <Panel className="bg-plantain">
      <h2 className="font-display text-xl font-extrabold">{celebrate ? 'Your household is ready! 🎉' : 'Invite your people'}</h2>
      <p className="mt-1 mb-3 text-sm font-medium">Send this link on WhatsApp, Telegram, anywhere. They pick a name and they're in.</p>
      <p className="mb-3 truncate rounded-xl border-[3px] border-char bg-white px-3 py-2 font-mono text-sm">{url}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="ghost" onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</Button>
        <Button onClick={share}>Share invite</Button>
      </div>
    </Panel>
  );
}
