import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

const variants = {
  primary: 'bg-pepper text-cream',
  secondary: 'bg-plantain text-char',
  ghost: 'bg-cream text-char',
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants };

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`chunk font-display w-full cursor-pointer rounded-2xl px-5 py-3.5 text-lg font-extrabold tracking-tight disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    />
  );
}

export function ButtonLink({
  to,
  variant = 'primary',
  children,
}: {
  to: string;
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`chunk font-display block w-full rounded-2xl px-5 py-3.5 text-center text-lg font-extrabold tracking-tight ${variants[variant]}`}
    >
      {children}
    </Link>
  );
}

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="font-display mb-1.5 block text-sm font-extrabold tracking-wide uppercase">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border-[3px] border-char bg-white px-4 py-3 text-lg outline-none focus:border-pepper focus:ring-4 focus:ring-pepper/20"
      />
    </label>
  );
}

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="ankara-soft min-h-dvh">
      <main className={`mx-auto px-4 py-8 ${wide ? 'max-w-3xl' : 'max-w-md'}`}>{children}</main>
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border-[3px] border-char bg-white p-5 shadow-chunk ${className}`}>{children}</section>;
}

export function Logo() {
  return (
    <Link to="/" className="font-display inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight">
      <span className="grid size-9 place-items-center rounded-full border-[3px] border-char bg-pepper text-lg">🍲</span>
      MealVote
    </Link>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border-[3px] border-pepper bg-pepper/10 px-3 py-2 text-sm font-bold text-pepper-deep">
      {message}
    </p>
  );
}

export function Loading({ label = 'Stirring the pot…' }: { label?: string }) {
  return (
    <div className="grid min-h-[40dvh] place-items-center">
      <p className="font-display animate-pulse text-xl font-extrabold">{label}</p>
    </div>
  );
}
