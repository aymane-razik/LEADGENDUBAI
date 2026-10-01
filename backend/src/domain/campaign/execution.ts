import type { ICampaign, ILead } from '../../models';

export type DeliveryChannel = 'email' | 'sms' | 'whatsapp';

export interface RecipientResolution {
  readonly leadId: string;
  readonly channel: DeliveryChannel;
  readonly contact: string;
  readonly optedIn: boolean;
  readonly suppressed: boolean;
  readonly suppressionReason?: string;
}

export interface SuppressionRule {
  readonly dnc: boolean;
  readonly blacklist: boolean;
  readonly languageMismatch?: boolean;
  readonly expiredLead?: boolean;
  readonly alreadyConverted?: boolean;
}

export interface DeliveryOutcome {
  readonly leadId: string;
  readonly channel: DeliveryChannel;
  readonly status: 'sent' | 'delivered' | 'bounced' | 'failed' | 'unsubscribed';
  readonly opened?: boolean;
  readonly clicked?: boolean;
  readonly timestamp: Date;
}

export interface DripStep {
  readonly step: number;
  readonly delayHours: number;
  readonly condition?: string;
  readonly channel: DeliveryChannel;
  readonly content: string;
}

export const isEligibleForCampaign = (lead: ILead): boolean => {
  if (!lead.isActive) return false;
  if (lead.doNotContact || lead.isBlacklisted) return false;
  if (lead.status === 'deal_closed' || lead.status === 'lost') return false;
  return true;
};

export const resolveRecipient = (
  campaign: ICampaign,
  lead: ILead,
): RecipientResolution => {
  const suppression: SuppressionRule = {
    dnc: lead.doNotContact,
    blacklist: lead.isBlacklisted,
    languageMismatch: false,
    expiredLead: false,
    alreadyConverted: lead.status === 'deal_closed',
  };

  let suppressionReason: string | undefined;
  if (suppression.dnc) suppressionReason = 'Do not contact';
  else if (suppression.blacklist) suppressionReason = 'Blacklisted';
  else if (suppression.alreadyConverted) suppressionReason = 'Already converted';

  const contact = campaign.type === 'email' || campaign.type === 'multi_channel'
    ? lead.email
    : lead.phone;

  return {
    leadId: lead._id.toString(),
    channel: campaign.type === 'whatsapp' ? 'whatsapp' : campaign.type === 'sms' ? 'sms' : 'email',
    contact,
    optedIn: !suppression.dnc && !suppression.blacklist,
    suppressed: !!suppressionReason,
    suppressionReason,
  };
};

export const computeDripSchedule = (
  campaign: ICampaign,
  startedAt: Date,
): Array<{ step: number; scheduledAt: Date; condition?: string }> => {
  const sequences = campaign.schedule.sequences ?? [];
  const timezone = campaign.schedule.timezone ?? 'Asia/Dubai';
  return sequences.map((s) => {
    const stepStart = new Date(startedAt);
    stepStart.setHours(stepStart.getHours() + s.delay);
    return {
      step: s.step,
      scheduledAt: stepStart,
      condition: s.condition as string | undefined,
    };
  });
};

export const applyDeliveryOutcome = (
  campaign: ICampaign,
  outcome: DeliveryOutcome,
): Partial<ICampaign['metrics']> => {
  const metrics: Partial<ICampaign['metrics']> = {};
  metrics.sent = (campaign.metrics.sent ?? 0) + 1;

  switch (outcome.status) {
    case 'delivered':
      metrics.delivered = (campaign.metrics.delivered ?? 0) + 1;
      break;
    case 'bounced':
    case 'failed':
      metrics.failed = (campaign.metrics.failed ?? 0) + 1;
      break;
    case 'unsubscribed':
      metrics.unsubscribed = (campaign.metrics.unsubscribed ?? 0) + 1;
      break;
  }

  if (outcome.opened) metrics.opened = (campaign.metrics.opened ?? 0) + 1;
  if (outcome.clicked) metrics.clicked = (campaign.metrics.clicked ?? 0) + 1;

  return metrics;
};
