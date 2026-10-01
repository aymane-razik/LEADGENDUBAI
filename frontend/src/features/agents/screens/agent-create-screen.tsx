'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { apiPost, getApiErrorMessage } from '@/lib/api';
import { useSession } from '@/components/ui/session-provider';
import { PageHeader } from '@/components/organisms/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AgentCreateScreen() {
  const router = useRouter();
  const { user } = useSession();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [saving, setSaving] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const create = async () => {
    setSaving(true);
    try {
      await apiPost('/users', { ...form, role: 'agent', isActive: true });
      toast.success('Agent added to the team');
      router.replace('/dashboard/agents');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not add team member'));
    } finally { setSaving(false); }
  };

  if (user?.role !== 'admin') return <Card><CardContent className="py-16 text-center"><h2 className="text-lg font-semibold">Admin access required</h2><p className="mt-2 text-sm text-muted-foreground">Ask a workspace admin to invite a team member.</p><Button className="mt-5" variant="outline" onClick={() => router.push('/dashboard/agents')}><ArrowLeft className="mr-2 size-4"/>Back to team</Button></CardContent></Card>;

  return <div className="space-y-6"><PageHeader title="Add a team member" eyebrow="TEAM / INVITE" description="Create a workspace account for a Dubai Realty Group agent." actions={<Button variant="outline" onClick={() => router.push('/dashboard/agents')}><ArrowLeft className="mr-2 size-4"/>Back to team</Button>}/><Card className="max-w-3xl"><CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="size-4 text-[#d6f66d]"/>Agent details</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">{(['firstName','lastName','email','phone','password'] as const).map((key) => <div key={key} className="space-y-2"><Label htmlFor={key}>{key === 'firstName' ? 'First name' : key === 'lastName' ? 'Last name' : key === 'email' ? 'Work email' : key === 'phone' ? 'Phone (optional)' : 'Temporary password'}</Label><Input id={key} type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'} autoComplete={key === 'password' ? 'new-password' : undefined} value={form[key]} onChange={(event) => update(key, event.target.value)} required={key !== 'phone'} minLength={key === 'password' ? 8 : undefined}/></div>)}<div className="flex justify-end gap-2 sm:col-span-2"><Button variant="outline" onClick={() => router.push('/dashboard/agents')}>Cancel</Button><Button onClick={create} disabled={saving || !form.firstName || !form.lastName || !form.email || form.password.length < 8}>{saving ? 'Adding…' : 'Add agent'}</Button></div></CardContent></Card></div>;
}
