'use client';

import { useState } from 'react';
import { apiPost, getApiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CreateLeadInput, LeadSource, LeadPropertyType, LeadPurpose, LeadTimeline, LeadBudget, LeadLanguage, LeadFinancing } from '@/types';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

type LeadForm = Omit<Partial<CreateLeadInput>, 'budget'> & { budget: LeadBudget };

export function CreateLeadDialog({ open, onOpenChange, onCreated }: CreateLeadDialogProps) {
  const [form, setForm] = useState<LeadForm>({
    source: 'landing_page',
    firstName: '',
    email: '',
    phone: '',
    propertyType: [],
    purpose: 'buy',
    budget: { min: 0, max: 0, currency: 'AED' },
    locations: [],
    timeline: 'flexible',
  });
  const [submitting, setSubmitting] = useState(false);

  const setString = (key: keyof CreateLeadInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setLang = (lang: LeadLanguage) => setForm((f) => ({ ...f, language: lang }));

  const togglePropType = (t: LeadPropertyType) => setForm((f) => ({
    ...f,
    propertyType: f.propertyType?.includes(t) ? f.propertyType.filter((x) => x !== t) : [...(f.propertyType ?? []), t],
  }));

  const setSource = (s: LeadSource) => setForm((f) => ({ ...f, source: s }));

  const setPurpose = (p: LeadPurpose) => setForm((f) => ({ ...f, purpose: p }));

  const setTimeline = (t: LeadTimeline) => setForm((f) => ({ ...f, timeline: t }));

  const setBudget = (key: 'min' | 'max', val: string) => {
    const num = parseInt(val, 10) || 0;
    setForm((f) => ({ ...f, budget: { ...f.budget, [key]: num } }));
  };

  const submit = async () => {
    if (!form.firstName || !form.email || !form.phone || !form.propertyType?.length || !form.locations?.length) {
      return;
    }
    const rawPhone = form.phone.replace(/[\s()-]/g, '');
    const phone = rawPhone.startsWith('+971') ? rawPhone : rawPhone.startsWith('00971') ? `+${rawPhone.slice(2)}` : rawPhone.startsWith('971') ? `+${rawPhone}` : rawPhone.startsWith('0') ? `+971${rawPhone.slice(1)}` : `+971${rawPhone}`;
    if (!/^\+971[1-9]\d{7,8}$/.test(phone)) {
      toast.error('Enter a valid UAE number, such as +971501234567 or 0501234567.');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost('/leads', { ...form, phone });
      onCreated();
      setForm({
        source: 'landing_page',
        firstName: '',
        email: '',
        phone: '',
        propertyType: [],
        purpose: 'buy',
        budget: { min: 0, max: 0, currency: 'AED' },
        locations: [],
        timeline: 'flexible',
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not create lead'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>Enter the lead information. Required fields are marked.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" value={form.firstName} onChange={setString('firstName')} placeholder="Ahmed" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={form.lastName ?? ''} onChange={setString('lastName')} placeholder="Al Mansoori" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={setString('email')} placeholder="ahmed@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (UAE) *</Label>
              <Input id="phone" value={form.phone} onChange={setString('phone')} placeholder="+971501234567" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Source</Label>
            <div className="flex flex-wrap gap-2">
              {(['landing_page', 'bayut', 'propertyfinder', 'dubizzle', 'facebook', 'instagram', 'referral', 'manual'] as LeadSource[]).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={form.source === s ? 'default' : 'outline'}
                  size="sm"
                  className="text-2xs capitalize"
                  onClick={() => setSource(s)}
                >
                  {s.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Purpose *</Label>
              <Select value={form.purpose} onValueChange={(v) => setPurpose(v as LeadPurpose)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="invest">Invest</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Timeline *</Label>
              <Select value={form.timeline} onValueChange={(v) => setTimeline(v as LeadTimeline)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="1-3months">1-3 Months</SelectItem>
                  <SelectItem value="3-6months">3-6 Months</SelectItem>
                  <SelectItem value="6-12months">6-12 Months</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="bg-muted/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Property Types *</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(['apartment', 'villa', 'townhouse', 'penthouse', 'commercial', 'land'] as LeadPropertyType[]).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={form.propertyType?.includes(t) ? 'default' : 'outline'}
                  size="sm"
                  className="text-2xs capitalize"
                  onClick={() => togglePropType(t)}
                >
                  {t}
                </Button>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-1.5">
            <Label htmlFor="locations">Locations *</Label>
            <Input id="locations" value={form.locations?.join(', ')} onChange={(e) => setForm((f) => ({ ...f, locations: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} placeholder="Dubai Marina, Downtown Dubai" />
            <p className="text-xs text-muted-foreground">Comma-separated list of areas</p>
          </div>

          <Card className="bg-muted/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Budget</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="budgetMin">Min (AED)</Label>
                  <Input id="budgetMin" type="number" value={form.budget?.min ?? 0} onChange={(e) => setBudget('min', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="budgetMax">Max (AED) *</Label>
                  <Input id="budgetMax" type="number" value={form.budget?.max ?? 0} onChange={(e) => setBudget('max', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.budget?.currency ?? 'AED'} onValueChange={(v) => setForm((f) => ({ ...f, budget: { ...f.budget, currency: v as 'AED' | 'USD' } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !form.firstName || !form.email || !form.phone || !form.propertyType?.length || !form.locations?.length}>
            {submitting ? 'Creating...' : 'Create Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
