'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { WebhookSubscription } from '@/types';
import { Trash2, Edit2, Play, CheckCircle2, XCircle, Copy, Link2, Shield, Activity } from 'lucide-react';

interface WebhookRowProps {
  webhook: WebhookSubscription;
  onEdit?: (id: string) => void;
  onTest?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCopyUrl?: (url: string) => void;
}

export function WebhookRow({ webhook, onEdit, onTest, onDelete, onCopyUrl }: WebhookRowProps) {
  return (
    <Card className="overflow-hidden border border-border hover:border-sky-200 dark:hover:border-sky-800 transition-colors group">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant={webhook.active ? 'success' : 'destructive'} className="text-2xs">
                {webhook.active ? 'Active' : 'Paused'}
              </Badge>
              <Badge variant="outline" className="text-2xs">{webhook.events.length} events</Badge>
              <Badge variant="secondary" className="text-2xs flex items-center gap-1">
                <Shield className="h-3 w-3" /> Signed
              </Badge>
            </div>
            <h3 className="font-mono text-sm font-medium mt-1 break-all">{webhook.url}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {webhook.events.map((event) => (
                <Badge key={event} variant="secondary" className="text-2xs">{event}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-1">
            {webhook.active && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onTest?.(webhook.id)}>
                <Play className="h-3 w-3 mr-1" /> Test
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit?.(webhook.id)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30" onClick={() => onDelete?.(webhook.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate font-mono text-foreground">{webhook.url}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate">HMAC-SHA256 signed</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            <span>Created {new Date(webhook.createdAt).toLocaleDateString('en-IE', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onCopyUrl?.(webhook.url)}>
            <Copy className="h-3 w-3 mr-1" /> Copy URL
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
