'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { CampaignListItem } from '@/types';
import { Play, Pause, Megaphone, RotateCcw, Copy, Link2 } from 'lucide-react';

interface CampaignCardProps {
  campaign: CampaignListItem;
  onView?: (id: string) => void;
  onStart?: (id: string) => void;
  onPause?: (id: string) => void;
  onTest?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  paused: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  completed: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  archived: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-300 dark:border-zinc-800',
};

export function CampaignCard({ campaign, onView, onStart, onPause, onTest }: CampaignCardProps) {
  return (
    <Card className="overflow-hidden border border-border hover:border-sky-200 dark:hover:border-sky-800 transition-colors group">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge className={statusColors[campaign.status]}>{campaign.status}</Badge>
              <Badge variant="secondary" className="text-2xs">{campaign.type.replace(/_/g, ' ')}</Badge>
              {campaign.schedule.type !== 'immediate' && (
                <Badge variant="outline" className="text-2xs">{campaign.schedule.type}</Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm mt-1 line-clamp-1">{campaign.name}</h3>
            {campaign.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{campaign.description}</p>}
          </div>
          <div className="flex gap-1">
            {campaign.status === 'draft' && (
              <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => onStart?.(campaign.id)}>
                <Play className="h-3 w-3 mr-1" /> Start
              </Button>
            )}
            {campaign.status === 'active' && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onPause?.(campaign.id)}>
                <Pause className="h-3 w-3 mr-1" /> Pause
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStart?.(campaign.id)}>
                <Play className="h-3 w-3 mr-1" /> Resume
              </Button>
            )}
            {campaign.status === 'active' && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onTest?.(campaign.id)}>
                <RotateCcw className="h-3 w-3 mr-1" /> Test
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-lg font-semibold font-mono">{campaign.metrics.sent}</p>
            <p className="text-muted-foreground">Sent</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-lg font-semibold font-mono text-emerald-600 dark:text-emerald-400">{campaign.metrics.delivered}</p>
            <p className="text-muted-foreground">Delivered</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-lg font-semibold font-mono text-sky-600 dark:text-sky-400">{campaign.metrics.opened}</p>
            <p className="text-muted-foreground">Opens</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-lg font-semibold font-mono text-rose-600 dark:text-rose-400">{campaign.metrics.clicked}</p>
            <p className="text-muted-foreground">Clicks</p>
          </div>
        </div>

        {campaign.metrics.sent > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Delivery rate</span>
              <span className="font-medium tabular-nums">
                {((campaign.metrics.delivered / campaign.metrics.sent) * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={(campaign.metrics.delivered / campaign.metrics.sent) * 100} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
          <Megaphone className="h-3.5 w-3.5" />
          <span className="truncate">{campaign.targeting.maxRecipients ? `${campaign.targeting.maxRecipients} recipients` : 'No limit'}</span>
          <span className="text-muted-foreground">•</span>
          <span>{campaign.metrics.converted} converted</span>
          {campaign.metrics.revenue != null && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                AED {campaign.metrics.revenue.toLocaleString()}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-muted-foreground">
            {new Date(campaign.createdAt).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView?.(campaign.id)}>
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
