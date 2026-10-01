'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UserListItem, UserMetrics } from '@/types';
import { Mail, Phone, UserCheck, TrendingUp, Clock, DollarSign, BookOpen, MapPin } from 'lucide-react';

interface AgentCardProps {
  user: UserListItem;
  metrics?: UserMetrics;
  onView?: (id: string) => void;
  onPerformance?: (id: string) => void;
}

export function AgentCard({ user, metrics, onView, onPerformance }: AgentCardProps) {
  const initial = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`;
  const color = user.role === 'admin' ? 'bg-rose-500' : user.role === 'manager' ? 'bg-violet-500' : 'bg-emerald-500';

  return (
    <Card className="overflow-hidden border border-border hover:border-sky-200 dark:hover:border-sky-800 transition-colors group">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarFallback className="text-sm font-medium bg-primary text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{user.firstName} {user.lastName}</h3>
              <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'info' : 'secondary'} className="text-2xs capitalize">
                {user.role}
              </Badge>
              {user.isOnline && <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            {user.title && <p className="text-xs text-muted-foreground truncate">{user.title}</p>}
            {user.department && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" />
                <span>{user.department}</span>
              </div>
            )}
          </div>
          {user.isActive === false && <Badge variant="destructive" className="text-2xs">Inactive</Badge>}
        </div>

        {metrics && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded-md p-2">
              <p className="text-lg font-semibold font-mono">{metrics.leadsAssigned}</p>
              <p className="text-muted-foreground text-xs">Assigned</p>
            </div>
            <div className="bg-muted/50 rounded-md p-2">
              <p className="text-lg font-semibold font-mono">{metrics.leadsConverted}</p>
              <p className="text-muted-foreground text-xs">Converted</p>
            </div>
            <div className="bg-muted/50 rounded-md p-2 col-span-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Conversion rate</span>
                <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                  {(metrics.conversionRate * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.conversionRate * 100} className="h-1.5" />
            </div>
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Avg response: {metrics.avgResponseTime > 0 ? `${metrics.avgResponseTime}min` : '—'}</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Avg deal: AED {metrics.avgDealValue > 0 ? metrics.avgDealValue.toLocaleString() : '—'}</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Activities: {metrics.activitiesLogged}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-muted-foreground">
            {user.lastLogin && (
              <span className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" /> Last login {new Date(user.lastLogin).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onPerformance?.(user.id)}>
              <TrendingUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView?.(user.id)}>
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
