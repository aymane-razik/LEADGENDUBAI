'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/ui/session-provider';
import { apiPut, getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/organisms/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { localDemoIsActive, resetLocalDemo } from '@/lib/demo-api';
import { User, Mail, Bell, Phone, Building2, Key, Shield, Palette, Globe, Clock, Check, AlertCircle, UserCheck, Activity, MessageSquare } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshUser } = useSession();
  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    title: user?.title ?? '',
    department: user?.department ?? '',
    team: user?.team ?? '',
  });
  const [notifications, setNotifications] = useState({
    email: user?.settings?.notifications.email ?? true,
    sms: user?.settings?.notifications.sms ?? false,
    push: user?.settings?.notifications.push ?? true,
    leadAssignment: user?.settings?.notifications.leadAssignment ?? true,
    dailyDigest: user?.settings?.notifications.dailyDigest ?? true,
  });
  const [preferences, setPreferences] = useState({
    language: user?.settings?.preferences.language ?? 'en',
    timezone: user?.settings?.preferences.timezone ?? 'Asia/Dubai',
    theme: user?.settings?.preferences.theme ?? 'dark',
    dateFormat: user?.settings?.preferences.dateFormat ?? 'YYYY-MM-DD',
  });
  const [saving, setSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const localDemo = localDemoIsActive();

  const changePassword = async () => {
    setChangingPassword(true);
    try {
      const result = await apiPut<{ message?: string }>('/auth/change-password', { currentPassword, newPassword });
      toast.success(result.message ?? 'Password updated');
      setPasswordOpen(false);
      setCurrentPassword(''); setNewPassword('');
    } catch (error) { toast.error(getApiErrorMessage(error, 'Password could not be changed')); }
    finally { setChangingPassword(false); }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await apiPut<{ data?: typeof user }>('/auth/me', {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        title: profile.title,
        department: profile.department,
        team: profile.team,
      });
      if (response.data) refreshUser(response.data);
      toast.success('Profile saved');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Profile could not be saved'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const response = await apiPut<{ data?: typeof user }>('/auth/me', { settings: { notifications } });
      if (response.data) refreshUser(response.data);
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Notification preferences could not be saved'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const response = await apiPut<{ data?: typeof user }>('/auth/me', { settings: { preferences } });
      if (response.data) refreshUser(response.data);
      toast.success('Preferences saved');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Preferences could not be saved'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account, notifications, and preferences." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Profile Information</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium">{profile.firstName} {profile.lastName}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <Badge variant="secondary" className="mt-1 capitalize">{user?.role}</Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} readOnly />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+971501234567" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Job Title</Label>
                  <Input id="title" value={profile.title} onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))} placeholder="Senior Sales Agent" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} placeholder="Sales" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="team">Team</Label>
                <Input id="team" value={profile.team} onChange={(e) => setProfile((p) => ({ ...p, team: e.target.value }))} placeholder="Dubai Marina Team" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Change Password</p>
                  <p className="text-xs text-muted-foreground">Update your account password</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>Change Password</Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info('Two-factor authentication is not configured for this demo workspace.')}>2FA setup status</Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">API Keys</p>
                  <p className="text-xs text-muted-foreground">Manage API access credentials</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/webhooks')}>Manage webhooks</Button>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
              {localDemo && <div className="flex items-center justify-between rounded-xl border border-[#d6f66d]/15 bg-[#d6f66d]/[0.04] p-4"><div><p className="text-sm font-medium">Browser-only demo workspace</p><p className="mt-1 text-xs text-muted-foreground">Your changes are saved on this device. Reseed the sample workspace before another recording.</p></div><Button variant="outline" size="sm" onClick={() => { if (window.confirm('Reset this browser-only demo workspace to its original sample data?')) { resetLocalDemo(); window.location.assign('/login'); } }}>Reseed local demo</Button></div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center"><Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                  </div>
                </div>
                <Switch checked={notifications.email} onCheckedChange={(v) => setNotifications((n) => ({ ...n, email: v }))} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center"><Bell className="h-4 w-4 text-sky-600 dark:text-sky-400" /></div>
                  <div>
                    <p className="text-sm font-medium">SMS Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications via SMS</p>
                  </div>
                </div>
                <Switch checked={notifications.sms} onCheckedChange={(v) => setNotifications((n) => ({ ...n, sms: v }))} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center"><Phone className="h-4 w-4 text-violet-600 dark:text-violet-400" /></div>
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Browser push notifications</p>
                  </div>
                </div>
                <Switch checked={notifications.push} onCheckedChange={(v) => setNotifications((n) => ({ ...n, push: v }))} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center"><UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
                  <div>
                    <p className="text-sm font-medium">Lead Assignment Alerts</p>
                    <p className="text-xs text-muted-foreground">Get notified when leads are assigned to you</p>
                  </div>
                </div>
                <Switch checked={notifications.leadAssignment} onCheckedChange={(v) => setNotifications((n) => ({ ...n, leadAssignment: v }))} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center"><Activity className="h-4 w-4 text-rose-600 dark:text-rose-400" /></div>
                  <div>
                    <p className="text-sm font-medium">Daily Digest</p>
                    <p className="text-xs text-muted-foreground">Daily summary of your activity</p>
                  </div>
                </div>
                <Switch checked={notifications.dailyDigest} onCheckedChange={(v) => setNotifications((n) => ({ ...n, dailyDigest: v }))} />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Preferences</CardTitle>
              <CardDescription>Customize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="language">Language</Label>
                  <Select value={preferences.language} onValueChange={(v) => setPreferences((p) => ({ ...p, language: v as 'en' | 'ar' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={preferences.timezone} onValueChange={(v) => setPreferences((p) => ({ ...p, timezone: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="America/New_York">New York (EST)</SelectItem>
                      <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Workspace appearance</Label><div className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-[11px] text-slate-300"><span className="size-2 rounded-full bg-[#d6f66d]"/>Dune midnight</div></div>
                <div className="space-y-1.5">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={preferences.dateFormat} onValueChange={(v) => setPreferences((p) => ({ ...p, dateFormat: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePreferences} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Integrations</CardTitle>
              <CardDescription>Connect third-party services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'SMTP Email', description: 'Configure email delivery', icon: Mail, enabled: true },
                { name: 'Twilio SMS', description: 'Send SMS notifications', icon: Phone, enabled: false },
                { name: 'WhatsApp Business', description: 'Send WhatsApp messages', icon: MessageSquare, enabled: false },
                { name: 'Salesforce', description: 'Sync leads and deals', icon: Building2, enabled: false },
                { name: 'Slack', description: 'Team notifications', icon: Bell, enabled: false },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <integration.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.enabled ? (
                      <Badge variant="success" className="flex items-center gap-1"><Check className="h-3 w-3" /> Connected</Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => toast.info(`${integration.name} needs provider credentials before it can be connected. Demo actions are simulated.`)}>Setup required</Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Team Management</CardTitle>
              <CardDescription>Manage team members and roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">Add team members and manage their roles and permissions.</p>
                <Button size="sm" onClick={() => router.push('/dashboard/agents/new')}>
                  <User className="h-4 w-4 mr-2" /> Invite Member
                </Button>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">View the team directory, agent activity, and performance.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/dashboard/agents')}>Open team directory</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent><DialogHeader><DialogTitle>Change password</DialogTitle><DialogDescription>Enter your current password and choose a new password with at least 8 characters.</DialogDescription></DialogHeader>
          <div className="space-y-4"><div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setPasswordOpen(false)}>Cancel</Button><Button onClick={changePassword} disabled={changingPassword || !currentPassword || newPassword.length < 8}>{changingPassword ? 'Updating…' : 'Update password'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
