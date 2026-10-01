'use client';

import Link from 'next/link';
import { ArrowLeft, Compass, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#080e19] px-6 text-white">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-[min(80vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d6f66d]/[0.08] shadow-[0_0_0_70px_rgba(214,246,109,.018),0_0_0_140px_rgba(214,246,109,.012)]" />
      <section className="relative w-full max-w-xl text-center">
        <div className="mx-auto mb-8 grid size-14 place-items-center rounded-2xl border border-[#d6f66d]/20 bg-[#d6f66d]/[0.07] text-[#d6f66d]"><Compass className="size-6" /></div>
        <p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#d6f66d]">Dune workspace · 404</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-.06em] sm:text-7xl">This path<br /><span className="text-slate-500">has drifted.</span></h1>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-slate-400">That page isn’t in this workspace. Head back to your dashboard or choose a destination.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="inline-flex h-10 items-center rounded-xl bg-[#d6f66d] px-4 text-[11px] font-semibold text-[#18220c]"><Home className="mr-2 size-4" />Dashboard</Link>
          <Link href="/" className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.035] px-4 text-[11px] font-semibold text-slate-300"><ArrowLeft className="mr-2 size-4" />Landing page</Link>
          <Link href="/dashboard/leads" className="inline-flex h-10 items-center rounded-xl px-4 text-[11px] font-semibold text-slate-400 hover:bg-white/[0.06] hover:text-white"><Search className="mr-2 size-4" />Find a lead</Link>
        </div>
      </section>
    </main>
  );
}
