'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ScraperListItem } from '@/types';
import { Play, Pause, RefreshCw, AlertCircle, CheckCircle2, Timer, BarChart3, Globe, Settings, Edit2, Eye } from 'lucide-react';

interface ScraperCardProps {
  scraper: ScraperListItem;
  onRun?: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  idle: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800',
  running: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  paused: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
};

export function ScraperCard({ scraper, onRun, onView, onEdit }: ScraperCardProps) {
  return (
    <Card className="overflow-hidden border border-border hover:border-sky-200 dark:hover:border-sky-800 transition-colors group">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge className={statusColors[scraper.status]}>{scraper.status}</Badge>
              <Badge variant="secondary" className="text-2xs capitalize">{scraper.source.replace(/_/g, ' ')}</Badge>
              <Badge variant="outline" className="text-2xs capitalize">{scraper.type.replace(/_/g, ' ')}</Badge>
              {scraper.enabled === false && <Badge variant="destructive" className="text-2xs">Disabled</Badge>}
            </div>
            <h3 className="font-semibold text-sm mt-1">{scraper.name}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <span className="truncate">{scraper.config.url}</span>
            </p>
          </div>
          <div className="flex gap-1">
            {scraper.status === 'idle' && scraper.enabled && (
              <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => onRun?.(scraper.id)}>
                <Play className="h-3 w-3 mr-1" /> Run
              </Button>
            )}
            {scraper.status === 'running' && (
              <Button size="sm" variant="outline" className="h-7 text-xs opacity-60" disabled>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Running
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(scraper.id)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {scraper.lastRun && (
          <div className="bg-muted/50 rounded-md p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Last run</span>
              <span className="font-medium">
                {scraper.lastRun.status === 'success' ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Success
                  </span>
                ) : scraper.lastRun.status === 'failed' ? (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3 w-3" /> Failed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3" /> {scraper.lastRun.status}
                  </span>
                )}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <p className="font-semibold font-mono">{scraper.lastRun.itemsProcessed}</p>
                <p className="text-muted-foreground">Processed</p>
              </div>
              <div>
                <p className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">{scraper.lastRun.itemsCreated}</p>
                <p className="text-muted-foreground">Created</p>
              </div>
              <div>
                <p className="font-semibold font-mono text-sky-600 dark:text-sky-400">{scraper.lastRun.itemsUpdated}</p>
                <p className="text-muted-foreground">Updated</p>
              </div>
              <div>
                <p className="font-semibold font-mono text-rose-600 dark:text-rose-400">{scraper.lastRun.itemsSkipped}</p>
                <p className="text-muted-foreground">Skipped</p>
              </div>
            </div>
            {scraper.lastRun.duration != null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {scraper.lastRun.duration >= 1000 ? `${(scraper.lastRun.duration / 1000).toFixed(1)}s` : `${scraper.lastRun.duration}ms`}
                </span>
                <span className="text-muted-foreground">
                  {new Date(scraper.lastRun.startedAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="flex items-center justify-center gap-1 bg-muted/50 rounded-md p-2">
            <BarChart3 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span className="font-semibold font-mono">{scraper.metrics.totalRuns}</span>
            <span className="text-muted-foreground">Total runs</span>
          </div>
          <div className="flex items-center justify-center gap-1 bg-muted/50 rounded-md p-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold font-mono">{(scraper.metrics.successRate * 100).toFixed(0)}%</span>
            <span className="text-muted-foreground">Success rate</span>
          </div>
          <div className="flex items-center justify-center gap-1 bg-muted/50 rounded-md p-2">
            <Globe className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold font-mono">{scraper.metrics.totalItems}</span>
            <span className="text-muted-foreground">Total items</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-muted-foreground">
            Schedule: <span className="font-medium">{scraper.schedule}</span>
            {scraper.timezone !== 'Asia/Dubai' && <span className="text-muted-foreground ml-1">({scraper.timezone})</span>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView?.(scraper.id)} aria-label="View data stream">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(scraper.id)} aria-label="Edit data stream">
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
