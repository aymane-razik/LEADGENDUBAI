'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Compass, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/lib/api';
import { useSession } from '@/components/ui/session-provider';
import type { AuthUser, LoginInput } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  const fillDemoAccount = () => {
    setEmail('admin@dubairealestate.com');
    setPassword('Demo@123456');
    setError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const response = await apiPost<{ success: boolean; message: string; data?: { user: AuthUser } }>('/auth/login', { email, password } satisfies LoginInput);
      if (response.data?.user) { login(response.data.user); router.push('/dashboard'); }
      else setError(response.message || 'We could not start your session.');
    } catch (cause: unknown) {
      const message = cause && typeof cause === 'object' && 'response' in cause
        ? (cause as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(typeof message === 'string' ? message : 'Check your details and try again.');
    } finally { setLoading(false); }
  };

  return (
    <main className="grid min-h-screen bg-[#090f1b] lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-white/[0.07] bg-[#111a2a] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=88')" }}/>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,13,25,.58)_0%,rgba(7,13,25,.2)_32%,rgba(7,13,25,.92)_100%)]"/>
        <div className="absolute inset-0 opacity-[.18] [background-image:linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(180deg,black,transparent_90%)]"/>

        <div className="relative z-10 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-[15px] bg-[#d6f66d] text-[#111a0a] shadow-[0_0_36px_rgba(214,246,109,.23)]"><Compass className="size-6"/></div>
          <div><div className="text-[15px] font-bold tracking-[.16em] text-white">DUNE<span className="text-[#d6f66d]">.</span></div><div className="mt-0.5 text-[9px] uppercase tracking-[.2em] text-white/50">Real estate intelligence</div></div>
        </div>

        <div className="relative z-10 max-w-2xl pb-2">
          <div className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#d6f66d]"><span className="size-1.5 rounded-full bg-[#d6f66d] shadow-[0_0_14px_#d6f66d]"/>Dubai, connected</div>
          <h1 className="max-w-xl text-5xl font-medium leading-[1.04] tracking-[-.055em] text-white xl:text-[66px]">Every signal.<br/>Every opportunity.<br/><span className="text-[#d6f66d]">In one view.</span></h1>
          <p className="mt-6 max-w-md text-[13px] leading-7 text-white/65">A sharper way to see your pipeline, understand the market, and move with the right client at the right moment.</p>
          <div className="mt-11 grid max-w-lg grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-[#08101e]/50 py-4 backdrop-blur-xl">
            {[['60+', 'active leads'], ['35', 'live listings'], ['24/7', 'market pulse']].map(([value, label]) => <div key={label} className="px-5"><p className="text-xl font-semibold tracking-tight text-white">{value}</p><p className="mt-1 text-[9px] uppercase tracking-[.14em] text-white/45">{label}</p></div>)}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[9px] uppercase tracking-[.16em] text-white/35"><span>Built for the pace of Dubai</span><span>25°12′N&nbsp;&nbsp; 55°16′E</span></div>
      </section>

      <section className="relative flex min-h-screen flex-col justify-between px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden"><span className="grid size-9 place-items-center rounded-xl bg-[#d6f66d] text-[#111a0a]"><Compass className="size-5"/></span><span className="text-xs font-bold tracking-[.15em]">DUNE<span className="text-[#d6f66d]">.</span></span></div>
          <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[.13em] text-slate-500"><ShieldCheck className="size-3.5 text-[#d6f66d]"/> Secure workspace</span>
        </div>

        <div className="mx-auto w-full max-w-[390px] py-12 lg:py-0">
          <div className="mb-8"><p className="eyebrow mb-3">Your workspace is ready</p><h2 className="text-[32px] font-semibold tracking-[-.05em] text-white">Welcome back</h2><p className="mt-2 text-[12px] text-slate-500">Sign in to pick up where your team left off.</p></div>

          {error && <div role="alert" className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] px-3.5 py-3 text-[11px] leading-relaxed text-rose-200">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block"><span className="mb-2 block text-[10px] font-semibold text-slate-300">Work email</span><span className="relative block"><Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-600"/><Input id="email" type="email" autoComplete="username" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-xl border-white/[0.09] bg-white/[0.035] pl-10 text-[12px] text-white placeholder:text-slate-600 focus-visible:border-[#d6f66d]/40" required/></span></label>
            <label className="block"><span className="mb-2 flex items-center justify-between text-[10px] font-semibold text-slate-300"><span>Password</span><span className="text-[9px] font-normal text-slate-600">At least 8 characters</span></span><span className="relative block"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-600"/><Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-xl border-white/[0.09] bg-white/[0.035] pl-10 pr-11 text-[12px] text-white placeholder:text-slate-600 focus-visible:border-[#d6f66d]/40" required/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300">{showPassword ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}</button></span></label>
            <div className="flex items-center justify-between pt-0.5"><label className="flex items-center gap-2 text-[10px] text-slate-500"><input type="checkbox" className="size-3.5 accent-[#d6f66d]"/> Keep me signed in</label><button type="button" className="text-[10px] font-medium text-[#d6f66d] transition hover:text-white" onClick={() => setError('Ask your workspace administrator to reset your password.')}>Forgot password?</button></div>
            <Button type="submit" disabled={loading} className="group h-12 w-full justify-between rounded-xl bg-[#d6f66d] px-4 text-[12px] font-bold text-[#17200c] shadow-[0_8px_30px_rgba(214,246,109,.1)] hover:bg-[#e4ff87]">
              <span>{loading ? 'Opening your workspace…' : 'Continue to workspace'}</span><ArrowRight className="size-4 transition group-hover:translate-x-1"/>
            </Button>
          </form>

          {demoMode && <div className="mt-7 rounded-2xl border border-[#d6f66d]/15 bg-[#d6f66d]/[0.045] p-4"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#d6f66d]/10 text-[#d6f66d]"><Sparkles className="size-4"/></span><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-slate-200">Recording a product demo?</p><p className="mt-1 text-[10px] leading-relaxed text-slate-500">Fill the seeded workspace account in one click.</p></div><button type="button" onClick={fillDemoAccount} className="shrink-0 rounded-lg border border-[#d6f66d]/20 px-2.5 py-1.5 text-[9px] font-semibold text-[#d6f66d] transition hover:bg-[#d6f66d]/10">Use demo access</button></div></div>}

          <div className="mt-8 flex items-center gap-3 text-[9px] text-slate-600"><span className="h-px flex-1 bg-white/[0.07]"/>Team access only<span className="h-px flex-1 bg-white/[0.07]"/></div>
          <p className="mt-4 text-center text-[9px] leading-relaxed text-slate-600">By continuing, you agree to your organization’s workspace policies.</p>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 text-[9px] text-slate-600"><span>© 2026 Dune Realty Intelligence</span><span className="hidden items-center gap-1.5 sm:flex"><Building2 className="size-3"/>Made for real estate teams</span></div>
      </section>
    </main>
  );
}
