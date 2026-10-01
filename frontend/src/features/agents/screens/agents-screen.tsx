'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, getApiErrorMessage, toList, unwrap } from '@/lib/api';
import { useSession } from '@/components/ui/session-provider';
import { PageHeader } from '@/components/organisms/page-header';
import { AgentCard } from '@/components/dashboard/agent-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { UserListItem, UserMetrics } from '@/types';
import { Search, RefreshCw, UserCheck, Users, TrendingUp, Mail, Phone } from 'lucide-react';

export default function AgentsPage() {
  const router = useRouter();
  const { user } = useSession();
  const [agents, setAgents] = useState<UserListItem[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, UserMetrics>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = user?.role === 'admin'
        ? await apiGet<unknown>('/users', { limit: 100 })
        : await apiGet<unknown>('/users/agents');
      const allUsers = toList<UserListItem>(res).items;
      const filtered = allUsers.filter((agent) =>
        (!roleFilter || agent.role === roleFilter)
        && (!search || `${agent.firstName} ${agent.lastName} ${agent.email}`.toLowerCase().includes(search.toLowerCase())),
      );
      setAgents(filtered);
      setTotal(filtered.length);

      const metrics = await Promise.all(
        filtered.slice(0, 20).map(async (agent) => {
          try {
            const m = await apiGet<UserMetrics>(`/users/${agent.id}/metrics`);
            return { id: agent.id, metrics: unwrap<UserMetrics>(m) };
          } catch {
            return { id: agent.id, metrics: {} as UserMetrics };
          }
        }),
      );
      setMetricsMap(Object.fromEntries(metrics.map((m) => [m.id, m.metrics])));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load agents'));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, user?.role]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Sales agents and their performance metrics."
        actions={
          <div className="flex items-center gap-2">
            <Input placeholder="Search agents..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchAgents} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            {user?.role === 'admin' && <Button size="sm" onClick={() => router.push('/dashboard/agents/new')}><UserCheck className="mr-2 size-4"/>Add agent</Button>}
          </div>
        }
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No agents found.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  user={agent}
                  metrics={metricsMap[agent.id]}
                  onView={(id) => router.push(`/dashboard/agents/${id}`)}
                  onPerformance={(id) => router.push(`/dashboard/agents/${id}?tab=performance`)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {agents.length > 0 && <p className="text-sm text-muted-foreground">{total} team members</p>}
    </div>
  );
}
