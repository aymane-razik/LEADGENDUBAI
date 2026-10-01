'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3, Bell, Building2, ChevronDown, Command, Compass, LayoutDashboard,
  Link2, LogOut, Megaphone, Search, Sparkles, Users, UserRound, UserRoundCheck, Workflow,
} from 'lucide-react';
import { useSession } from '@/components/ui/session-provider';
import { cn } from '@/lib/utils';
import { localDemoIsActive } from '@/lib/demo-api';

const navigation = [
  { label: 'Command center', items: [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/analytics', label: 'Insights', icon: BarChart3 },
  ] },
  { label: 'Workspace', items: [
    { href: '/dashboard/leads', label: 'Leads', icon: Users, count: '60' },
    { href: '/dashboard/properties', label: 'Properties', icon: Building2 },
    { href: '/dashboard/campaigns', label: 'Campaigns', icon: Megaphone },
    { href: '/dashboard/agents', label: 'People', icon: UserRoundCheck },
  ] },
  { label: 'Automation', items: [
    { href: '/dashboard/scrapers', label: 'Data streams', icon: Workflow },
    { href: '/dashboard/webhooks', label: 'Connections', icon: Link2 },
  ] },
];

const quickLinks = navigation.flatMap((group) => group.items);
const pageNames: Record<string, string> = {
  '/dashboard': 'Overview', '/dashboard/leads': 'Leads', '/dashboard/properties': 'Properties',
  '/dashboard/campaigns': 'Campaigns', '/dashboard/agents': 'People', '/dashboard/scrapers': 'Data streams',
  '/dashboard/analytics': 'Insights', '/dashboard/webhooks': 'Connections', '/dashboard/settings': 'Settings',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useSession();
  const [command, setCommand] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [localDemo, setLocalDemo] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    const syncLocalDemo = () => setLocalDemo(localDemoIsActive());
    syncLocalDemo();
    window.addEventListener('dune:local-demo-changed', syncLocalDemo);
    window.addEventListener('storage', syncLocalDemo);
    return () => { window.removeEventListener('dune:local-demo-changed', syncLocalDemo); window.removeEventListener('storage', syncLocalDemo); };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setPaletteOpen((open) => !open);
      }
      if (event.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const matches = useMemo(() => quickLinks.filter((item) => item.label.toLowerCase().includes(command.toLowerCase())), [command]);
  const initials = `${user?.firstName?.[0] ?? 'D'}${user?.lastName?.[0] ?? 'R'}`.toUpperCase();
  const title = pageNames[pathname] ?? Object.entries(pageNames).find(([path]) => path !== '/dashboard' && pathname.startsWith(path))?.[1] ?? 'Workspace';

  const navigateCommand = (href?: string) => {
    if (!href) return;
    router.push(href); setPaletteOpen(false); setCommand('');
  };

  return (
    <div className="min-h-screen text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col border-r border-white/[0.07] bg-[#0b1220]/90 px-4 py-5 backdrop-blur-2xl lg:flex">
        <Link href="/dashboard" className="group flex items-center gap-3 px-2 pb-7">
          <div className="relative grid size-10 place-items-center overflow-hidden rounded-[14px] bg-[#d6f66d] text-[#111a0a] shadow-[0_0_30px_rgba(214,246,109,.18)]">
            <Compass className="size-[21px] stroke-[2.2]" />
            <span className="absolute -right-1 -top-1 size-4 rounded-full bg-[#b2e2ff]/70 blur-sm" />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-bold tracking-[.14em] text-white">DUNE<span className="text-[#d6f66d]">.</span></div>
            <div className="mt-1 text-[9px] font-semibold uppercase tracking-[.19em] text-slate-500">Real estate intelligence</div>
          </div>
        </Link>

        <button onClick={() => { setPaletteOpen(true); setCommand(''); }} className="mb-7 flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-[11px] text-slate-400 transition hover:border-white/15 hover:bg-white/[0.06]">
          <Search className="size-3.5" /><span className="flex-1 text-left">Jump to anything</span><kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-500">⌘ K</kbd>
        </button>

        <div className="mb-5 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#233149] text-[#9cbcff]"><Building2 className="size-3.5" /></div>
            <div className="min-w-0"><p className="truncate text-[11px] font-semibold text-slate-200">Dubai Realty Group</p><p className="mt-0.5 text-[9px] uppercase tracking-[.13em] text-slate-500">Demo workspace</p></div>
          </div><ChevronDown className="size-3.5 text-slate-500" />
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto">
          {navigation.map((group) => <section key={group.label}>
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">{group.label}</p>
            <div className="space-y-1">
              {group.items.map(({ href, label, icon: Icon, count }) => {
                const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
                return <Link key={href} href={href} className={cn('group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[12px] font-medium transition-all', active ? 'bg-[#d6f66d] text-[#18220c] shadow-[0_5px_24px_rgba(214,246,109,.11)]' : 'text-slate-400 hover:bg-white/[0.055] hover:text-white')}>
                  {active && <span className="absolute -left-4 h-5 w-[2px] rounded-r bg-[#d6f66d]" />}
                  <Icon className="size-[16px] shrink-0" strokeWidth={active ? 2.2 : 1.8} /><span className="flex-1">{label}</span>
                  {count && <span className={cn('rounded-md px-1.5 py-0.5 text-[9px]', active ? 'bg-black/10 text-[#273115]' : 'bg-white/[0.06] text-slate-500')}>{count}</span>}
                </Link>;
              })}
            </div>
          </section>)}
        </nav>

        <div className="mt-4 rounded-2xl border border-[#d6f66d]/15 bg-[radial-gradient(ellipse_at_top_right,rgba(214,246,109,.12),transparent_60%),rgba(255,255,255,.025)] p-3.5">
          <div className="mb-2 flex items-center gap-2"><Sparkles className="size-3.5 text-[#d6f66d]"/><span className="text-[10px] font-semibold text-slate-200">Dune intelligence</span><span className="ml-auto rounded-full border border-[#d6f66d]/20 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-[#d6f66d]">Preview</span></div>
          <p className="text-[10px] leading-relaxed text-slate-500">Your next best action, surfaced from the live pipeline.</p>
          <Link href="/dashboard/analytics" className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-[#d6f66d]">Explore insights <span aria-hidden>↗</span></Link>
        </div>

        <Link href="/dashboard/settings" className={cn('mt-4 flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[0.055]', pathname.startsWith('/dashboard/settings') && 'bg-white/[0.07]')}>
          <div className="grid size-9 place-items-center rounded-xl border border-white/10 bg-[#182338] text-[11px] font-bold text-[#d6f66d]">{initials}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-slate-200">{user?.firstName ?? 'Workspace user'} {user?.lastName ?? ''}</p><p className="mt-0.5 truncate text-[9px] capitalize text-slate-500">{user?.role ?? 'Team member'}</p></div>
          <button aria-label="Sign out" onClick={(event) => { event.preventDefault(); event.stopPropagation(); logout(); router.push('/login'); }} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"><LogOut className="size-3.5" /></button>
        </Link>
      </aside>

      <div className="min-h-screen lg:pl-[250px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0a111f]/75 backdrop-blur-2xl">
          <div className="mx-auto flex h-[70px] max-w-[1720px] items-center gap-4 px-4 sm:px-7 xl:px-10">
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden"><span className="grid size-8 place-items-center rounded-xl bg-[#d6f66d] text-[#111a0a]"><Compass className="size-4" /></span><span className="text-xs font-bold tracking-[.12em]">DUNE<span className="text-[#d6f66d]">.</span></span></Link>
            <div className="hidden items-center gap-2 text-[10px] text-slate-600 sm:flex"><span>Workspace</span><span className="text-slate-700">/</span><span className="font-medium text-slate-300">{title}</span>{localDemo && <span className="ml-2 rounded-full border border-[#d6f66d]/20 bg-[#d6f66d]/[0.07] px-2 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-[#d6f66d]">Browser demo · saved here</span>}</div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button onClick={() => { setPaletteOpen(true); setCommand(''); }} className="hidden h-9 w-56 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[10px] text-slate-500 transition hover:border-white/15 sm:flex"><Search className="size-3.5"/><span className="flex-1 text-left">Find a lead, property...</span><Command className="size-3"/></button>
              <Link href="/dashboard/settings" aria-label="Notification preferences" className="relative grid size-9 place-items-center rounded-xl border border-white/[0.07] text-slate-400 transition hover:bg-white/[0.06] hover:text-white"><Bell className="size-4"/><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#d6f66d] ring-2 ring-[#0a111f]"/></Link>
              <span className="hidden h-7 w-px bg-white/[0.08] sm:block" />
              <button onClick={() => { logout(); router.push('/login'); }} title="Sign out" className="grid size-9 place-items-center rounded-xl bg-[#1b2940] text-[10px] font-bold text-[#d6f66d] ring-1 ring-white/10 lg:hidden">{initials}</button>
              <button onClick={() => router.push('/dashboard/settings')} className="hidden items-center gap-2.5 text-left lg:flex"><span className="grid size-9 place-items-center rounded-xl bg-[#1b2940] text-[10px] font-bold text-[#d6f66d] ring-1 ring-white/10">{initials}</span><span className="max-w-28 truncate text-[10px] font-semibold text-slate-300">{user?.firstName ?? 'Account'}</span><ChevronDown className="size-3 text-slate-600"/></button>
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100vh-70px)] max-w-[1720px] px-4 pb-24 pt-7 sm:px-7 sm:pt-9 lg:px-10 lg:pb-12">
          {!user && isLoading ? <div className="motion-enter mx-auto mt-24 max-w-sm text-center"><div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-white/10 border-t-[#d6f66d]"/><p className="text-xs text-slate-500">Opening your workspace…</p></div> : children}
        </main>
      </div>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/[0.08] bg-[#0b1220]/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-2xl lg:hidden">
        {[{ href: '/dashboard', label: 'Home', icon: LayoutDashboard }, { href: '/dashboard/leads', label: 'Leads', icon: Users }, { href: '/dashboard/properties', label: 'Homes', icon: Building2 }, { href: '/dashboard/campaigns', label: 'Growth', icon: Megaphone }, { href: '/dashboard/agents', label: 'People', icon: UserRound }].map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} className={cn('flex flex-col items-center gap-1 py-1 text-[9px] font-medium', active ? 'text-[#d6f66d]' : 'text-slate-500')}><Icon className="size-[17px]" strokeWidth={active ? 2.2 : 1.8}/>{label}</Link>;
        })}
      </nav>

      {paletteOpen && <div className="fixed inset-0 z-[80] flex items-start justify-center bg-[#030711]/70 px-4 pt-[18vh] backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaletteOpen(false); }}>
        <div role="dialog" aria-modal="true" aria-label="Workspace navigation" className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#111a2a] shadow-[0_30px_120px_rgba(0,0,0,.7)] motion-enter">
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-4"><Search className="size-4 text-slate-500"/><input autoFocus value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') navigateCommand(matches[0]?.href); }} placeholder="Search the workspace…" className="h-14 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"/><kbd className="rounded-md border border-white/10 px-1.5 py-1 text-[9px] text-slate-600">ESC</kbd></div>
          <div className="p-2"><p className="px-2 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[.18em] text-slate-600">Navigate</p>{matches.length ? matches.map(({ href, label, icon: Icon }) => <button key={href} onClick={() => navigateCommand(href)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs text-slate-300 transition hover:bg-white/[0.06] hover:text-white"><Icon className="size-4 text-[#d6f66d]"/>{label}<span className="ml-auto text-[9px] text-slate-600">↵</span></button>) : <p className="px-3 py-5 text-center text-xs text-slate-500">No matching pages</p>}</div>
          <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2.5 text-[9px] text-slate-600"><span>Navigate anywhere in Dune</span><span>↑↓ select · ↵ open</span></div>
        </div>
      </div>}
    </div>
  );
}
