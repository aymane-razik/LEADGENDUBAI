import type { IUser, IActivity, ILead } from '../../models';

export interface MetricsSnapshot {
  readonly leadsAssigned: number;
  readonly leadsContacted: number;
  readonly leadsQualified: number;
  readonly leadsConverted: number;
  readonly conversionRate: number;
  readonly avgResponseTime: number;
  readonly avgDealValue: number;
  readonly totalRevenue: number;
  readonly activitiesLogged: number;
}

export const computeMetricsFromActivities = (
  user: IUser,
  activities: Array<IActivity>,
  leads: Array<ILead>,
): MetricsSnapshot => {
  const assignedLeads = leads.filter((l) =>
    l.assignedTo?.toString() === user._id.toString() && l.isActive,
  );
  const contactedLeads = assignedLeads.filter((l) =>
    activities.some((a) => a.leadId.toString() === l._id.toString() && a.type !== 'note'),
  );
  const qualifiedLeads = assignedLeads.filter((l) => l.isQualified || l.status === 'qualified');
  const convertedLeads = assignedLeads.filter((l) => l.status === 'deal_closed');

  const inboundCallActivities = activities.filter(
    (a) => a.performedBy.toString() === user._id.toString() && a.type === 'call' && a.direction === 'inbound',
  );
  const outboundCallActivities = activities.filter(
    (a) => a.performedBy.toString() === user._id.toString() && a.type === 'call' && a.direction === 'outbound',
  );

  const avgResponseTime = outboundCallActivities.reduce((sum, a) => {
    const dur = a.metadata?.duration;
    return sum + (typeof dur === 'number' ? dur : 0);
  }, 0) / Math.max(1, outboundCallActivities.length);

  const totalRevenue = convertedLeads.reduce((sum, l) => {
    // In a real system deal value is stored; here we approximate from lead budget where applicable.
    return sum + (l.budget?.max ?? 0) * 0.01; // placeholder conversion value ratio
  }, 0);

  const conversionRate = assignedLeads.length > 0
    ? convertedLeads.length / assignedLeads.length
    : 0;

  return {
    leadsAssigned: assignedLeads.length,
    leadsContacted: contactedLeads.length,
    leadsQualified: qualifiedLeads.length,
    leadsConverted: convertedLeads.length,
    conversionRate: Math.round(conversionRate * 1000) / 1000,
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    avgDealValue: convertedLeads.length > 0
      ? Math.round(totalRevenue / convertedLeads.length)
      : 0,
    totalRevenue: Math.round(totalRevenue),
    activitiesLogged: activities.filter((a) => a.performedBy.toString() === user._id.toString()).length,
  };
};

export const applyDelta = (
  current: IUser['metrics'],
  delta: {
    leadsAssigned?: number;
    leadsContacted?: number;
    leadsQualified?: number;
    leadsConverted?: number;
    totalRevenue?: number;
    activitiesLogged?: number;
  },
): IUser['metrics'] => {
  return {
    leadsAssigned: (current.leadsAssigned ?? 0) + (delta.leadsAssigned ?? 0),
    leadsContacted: (current.leadsContacted ?? 0) + (delta.leadsContacted ?? 0),
    leadsQualified: (current.leadsQualified ?? 0) + (delta.leadsQualified ?? 0),
    leadsConverted: (current.leadsConverted ?? 0) + (delta.leadsConverted ?? 0),
    conversionRate: current.conversionRate ?? 0,
    avgResponseTime: current.avgResponseTime ?? 0,
    avgDealValue: current.avgDealValue ?? 0,
    totalRevenue: (current.totalRevenue ?? 0) + (delta.totalRevenue ?? 0),
    activitiesLogged: (current.activitiesLogged ?? 0) + (delta.activitiesLogged ?? 0),
  };
};
