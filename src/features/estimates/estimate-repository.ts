import AsyncStorage from '@react-native-async-storage/async-storage';

import { listClients } from '@/features/clients/client-repository';
import type { ClientRecord } from '@/features/clients/client.types';
import { supabase } from '@/lib/supabase/client';

import { calculateEstimateTotals } from './estimate-calculations';
import type {
  EstimateDetail,
  EstimateInput,
  EstimateLineItemInput,
  EstimateLineItemRecord,
  EstimateRecord,
  EstimateStatus,
  EstimateSummary,
} from './estimate.types';

type RepositoryContext = {
  isDemo: boolean;
  userId?: string;
};

type DemoEstimate = EstimateRecord & {
  line_items: EstimateLineItemRecord[];
};

const DEMO_ESTIMATES_KEY = 'quotepilot:demo:estimates';

function requireSupabaseContext(context: RepositoryContext) {
  if (!context.userId) {
    throw new Error('You need to be logged in to manage estimates.');
  }

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return { client: supabase, userId: context.userId };
}

function createDemoId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sortEstimates<T extends { created_at: string }>(estimates: T[]) {
  return [...estimates].sort((first, second) => second.created_at.localeCompare(first.created_at));
}

function getSeedEstimates(): DemoEstimate[] {
  const lineItems: EstimateLineItemRecord[] = [
    {
      created_at: '2026-06-30T14:00:00.000Z',
      description: 'Labor',
      estimate_id: 'demo-estimate-1',
      id: 'demo-estimate-line-1',
      quantity_milli: 2000,
      sort_order: 0,
      taxable: true,
      unit_price_minor: 9500,
      updated_at: '2026-06-30T14:00:00.000Z',
      user_id: 'demo-user',
    },
    {
      created_at: '2026-06-30T14:00:00.000Z',
      description: 'Materials',
      estimate_id: 'demo-estimate-1',
      id: 'demo-estimate-line-2',
      quantity_milli: 1000,
      sort_order: 1,
      taxable: true,
      unit_price_minor: 4000,
      updated_at: '2026-06-30T14:00:00.000Z',
      user_id: 'demo-user',
    },
  ];
  const totals = calculateEstimateTotals({
    discount_rate_bps: 0,
    discount_type: 'none',
    discount_value_minor: 0,
    line_items: lineItems,
    tax_rate_bps: 0,
  });

  return [
    {
      client_id: 'demo-client-1',
      created_at: '2026-06-30T14:00:00.000Z',
      currency: 'USD',
      discount_rate_bps: 0,
      discount_type: 'none',
      discount_value_minor: 0,
      estimate_number: 'EST-0001',
      expiration_date: null,
      follow_up_date: null,
      id: 'demo-estimate-1',
      internal_notes: 'Demo estimate for Phase 6 editing and status changes.',
      issue_date: '2026-06-30',
      last_follow_up_date: null,
      line_items: lineItems,
      notes: 'Thanks for the opportunity to quote this work.',
      status: 'draft',
      subtotal_minor: totals.subtotal_minor,
      tax_amount_minor: totals.tax_amount_minor,
      tax_rate_bps: 0,
      terms: 'Estimate valid for 14 days.',
      title: 'Light switch replacement',
      total_minor: totals.total_minor,
      updated_at: '2026-06-30T14:00:00.000Z',
      user_id: 'demo-user',
    },
  ];
}

async function readDemoEstimates() {
  const stored = await AsyncStorage.getItem(DEMO_ESTIMATES_KEY);

  if (!stored) {
    const seedEstimates = getSeedEstimates();
    await AsyncStorage.setItem(DEMO_ESTIMATES_KEY, JSON.stringify(seedEstimates));
    return seedEstimates;
  }

  return JSON.parse(stored) as DemoEstimate[];
}

async function writeDemoEstimates(estimates: DemoEstimate[]) {
  await AsyncStorage.setItem(DEMO_ESTIMATES_KEY, JSON.stringify(estimates));
}

function buildClientMap(clients: ClientRecord[]) {
  return new Map(clients.map((client) => [client.id, client]));
}

async function getClientsById(clientIds: string[], context: RepositoryContext) {
  if (clientIds.length === 0) {
    return new Map<string, ClientRecord>();
  }

  if (context.isDemo) {
    const clients = await listClients(context);
    return buildClientMap(clients.filter((client) => clientIds.includes(client.id)));
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data, error } = await client.from('clients').select('*').eq('user_id', userId).in('id', clientIds);

  if (error) {
    throw new Error(error.message);
  }

  return buildClientMap((data as ClientRecord[]) ?? []);
}

function toSummary(estimate: EstimateRecord, clientMap: Map<string, ClientRecord>): EstimateSummary {
  return {
    ...estimate,
    client_name: clientMap.get(estimate.client_id)?.name ?? null,
  };
}

function toDetail(estimate: DemoEstimate | EstimateRecord, client: ClientRecord | null, lineItems: EstimateLineItemRecord[]) {
  return {
    ...estimate,
    client,
    line_items: [...lineItems].sort((first, second) => first.sort_order - second.sort_order),
  } satisfies EstimateDetail;
}

function normalizeLineItems(lineItems: EstimateLineItemInput[]) {
  return lineItems.map((lineItem, index) => ({
    ...lineItem,
    description: lineItem.description.trim(),
    sort_order: index,
  }));
}

function calculatePayload(values: EstimateInput) {
  const line_items = normalizeLineItems(values.line_items);
  const totals = calculateEstimateTotals({
    discount_rate_bps: values.discount_rate_bps,
    discount_type: values.discount_type,
    discount_value_minor: values.discount_value_minor,
    line_items,
    tax_rate_bps: values.tax_rate_bps,
  });

  return {
    estimate: {
      client_id: values.client_id,
      currency: values.currency,
      discount_rate_bps: values.discount_rate_bps,
      discount_type: values.discount_type,
      discount_value_minor: values.discount_value_minor,
      expiration_date: values.expiration_date,
      follow_up_date: values.follow_up_date,
      internal_notes: values.internal_notes,
      issue_date: values.issue_date,
      notes: values.notes,
      subtotal_minor: totals.subtotal_minor,
      tax_amount_minor: totals.tax_amount_minor,
      tax_rate_bps: values.tax_rate_bps,
      terms: values.terms,
      title: values.title,
      total_minor: totals.total_minor,
    },
    line_items,
  };
}

function parseEstimateNumberSuffix(estimateNumber: string, prefix: string) {
  const match = estimateNumber.match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`));
  return match ? Number(match[1]) : 0;
}

function formatEstimateNumber(prefix: string, nextNumber: number) {
  return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
}

export async function generateNextEstimateNumber(context: RepositoryContext, prefix = 'EST') {
  if (context.isDemo) {
    const estimates = await readDemoEstimates();
    const maxSuffix = estimates.reduce(
      (max, estimate) => Math.max(max, parseEstimateNumberSuffix(estimate.estimate_number, prefix)),
      0,
    );

    return formatEstimateNumber(prefix, maxSuffix + 1);
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data, error } = await client.from('estimates').select('estimate_number').eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  const maxSuffix = ((data as Pick<EstimateRecord, 'estimate_number'>[]) ?? []).reduce(
    (max, estimate) => Math.max(max, parseEstimateNumberSuffix(estimate.estimate_number, prefix)),
    0,
  );

  return formatEstimateNumber(prefix, maxSuffix + 1);
}

export async function listEstimates(context: RepositoryContext): Promise<EstimateSummary[]> {
  if (context.isDemo) {
    const estimates = sortEstimates(await readDemoEstimates());
    const clientMap = await getClientsById(
      estimates.map((estimate) => estimate.client_id),
      context,
    );

    return estimates.map((estimate) => toSummary(estimate, clientMap));
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data, error } = await client
    .from('estimates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const estimates = (data as EstimateRecord[]) ?? [];
  const clientMap = await getClientsById(
    estimates.map((estimate) => estimate.client_id),
    context,
  );

  return estimates.map((estimate) => toSummary(estimate, clientMap));
}

export async function getEstimate(id: string, context: RepositoryContext): Promise<EstimateDetail | null> {
  if (context.isDemo) {
    const estimates = await readDemoEstimates();
    const estimate = estimates.find((candidate) => candidate.id === id);

    if (!estimate) {
      return null;
    }

    const clientMap = await getClientsById([estimate.client_id], context);
    return toDetail(estimate, clientMap.get(estimate.client_id) ?? null, estimate.line_items);
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data: estimateData, error: estimateError } = await client
    .from('estimates')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (estimateError) {
    throw new Error(estimateError.message);
  }

  if (!estimateData) {
    return null;
  }

  const estimate = estimateData as EstimateRecord;
  const { data: lineItemData, error: lineItemError } = await client
    .from('estimate_line_items')
    .select('*')
    .eq('estimate_id', id)
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (lineItemError) {
    throw new Error(lineItemError.message);
  }

  const clientMap = await getClientsById([estimate.client_id], context);

  return toDetail(estimate, clientMap.get(estimate.client_id) ?? null, (lineItemData as EstimateLineItemRecord[]) ?? []);
}

function isUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === '23505');
}

export async function createEstimate(
  values: EstimateInput,
  context: RepositoryContext,
  prefix = 'EST',
): Promise<EstimateDetail> {
  if (context.isDemo) {
    const estimates = await readDemoEstimates();
    const now = new Date().toISOString();
    const id = createDemoId('demo-estimate');
    const estimateNumber = values.estimate_number || (await generateNextEstimateNumber(context, prefix));
    const payload = calculatePayload(values);
    const lineItems = payload.line_items.map((lineItem, index) => ({
      ...lineItem,
      created_at: now,
      estimate_id: id,
      id: createDemoId('demo-estimate-line'),
      sort_order: index,
      updated_at: now,
      user_id: 'demo-user',
    }));
    const estimate: DemoEstimate = {
      ...payload.estimate,
      created_at: now,
      estimate_number: estimateNumber,
      id,
      last_follow_up_date: null,
      line_items: lineItems,
      status: 'draft',
      updated_at: now,
      user_id: 'demo-user',
    };

    await writeDemoEstimates([estimate, ...estimates]);
    const clientMap = await getClientsById([estimate.client_id], context);
    return toDetail(estimate, clientMap.get(estimate.client_id) ?? null, estimate.line_items);
  }

  const { client, userId } = requireSupabaseContext(context);
  let estimateNumber = values.estimate_number || (await generateNextEstimateNumber(context, prefix));
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const payload = calculatePayload({ ...values, estimate_number: estimateNumber });
    const { data, error } = await client
      .from('estimates')
      .insert({
        ...payload.estimate,
        estimate_number: estimateNumber,
        status: 'draft',
        user_id: userId,
      })
      .select('*')
      .single();

    if (error) {
      lastError = error;

      if (isUniqueViolation(error)) {
        estimateNumber = await generateNextEstimateNumber(context, prefix);
        continue;
      }

      throw new Error(error.message);
    }

    const estimate = data as EstimateRecord;
    const lineItems = payload.line_items.map((lineItem) => ({
      ...lineItem,
      estimate_id: estimate.id,
      user_id: userId,
    }));
    const { error: lineItemError } = await client.from('estimate_line_items').insert(lineItems);

    if (lineItemError) {
      await client.from('estimates').delete().eq('id', estimate.id).eq('user_id', userId);
      throw new Error(lineItemError.message);
    }

    const detail = await getEstimate(estimate.id, context);

    if (!detail) {
      throw new Error('Estimate was created but could not be loaded.');
    }

    return detail;
  }

  throw new Error(
    isUniqueViolation(lastError)
      ? 'Unable to generate a unique estimate number. Try again.'
      : 'Unable to create estimate.',
  );
}

export async function updateEstimate(
  id: string,
  values: EstimateInput,
  context: RepositoryContext,
): Promise<EstimateDetail> {
  if (context.isDemo) {
    const estimates = await readDemoEstimates();
    const existingEstimate = estimates.find((estimate) => estimate.id === id);

    if (!existingEstimate) {
      throw new Error('Estimate not found.');
    }

    const now = new Date().toISOString();
    const payload = calculatePayload(values);
    const lineItems = payload.line_items.map((lineItem, index) => ({
      ...lineItem,
      created_at: now,
      estimate_id: id,
      id: existingEstimate.line_items[index]?.id ?? createDemoId('demo-estimate-line'),
      sort_order: index,
      updated_at: now,
      user_id: 'demo-user',
    }));
    const updatedEstimate: DemoEstimate = {
      ...existingEstimate,
      ...payload.estimate,
      estimate_number: values.estimate_number ?? existingEstimate.estimate_number,
      line_items: lineItems,
      updated_at: now,
    };

    await writeDemoEstimates(estimates.map((estimate) => (estimate.id === id ? updatedEstimate : estimate)));
    const clientMap = await getClientsById([updatedEstimate.client_id], context);
    return toDetail(updatedEstimate, clientMap.get(updatedEstimate.client_id) ?? null, updatedEstimate.line_items);
  }

  const { client, userId } = requireSupabaseContext(context);
  const payload = calculatePayload(values);
  const { error } = await client
    .from('estimates')
    .update({
      ...payload.estimate,
      estimate_number: values.estimate_number,
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  const { error: deleteError } = await client.from('estimate_line_items').delete().eq('estimate_id', id).eq('user_id', userId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: insertError } = await client.from('estimate_line_items').insert(
    payload.line_items.map((lineItem) => ({
      ...lineItem,
      estimate_id: id,
      user_id: userId,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }

  const detail = await getEstimate(id, context);

  if (!detail) {
    throw new Error('Estimate was updated but could not be loaded.');
  }

  return detail;
}

export async function updateEstimateStatus(
  id: string,
  status: EstimateStatus,
  context: RepositoryContext,
): Promise<EstimateDetail> {
  if (context.isDemo) {
    const estimates = await readDemoEstimates();
    const existingEstimate = estimates.find((estimate) => estimate.id === id);

    if (!existingEstimate) {
      throw new Error('Estimate not found.');
    }

    const updatedEstimate = {
      ...existingEstimate,
      status,
      updated_at: new Date().toISOString(),
    };

    await writeDemoEstimates(estimates.map((estimate) => (estimate.id === id ? updatedEstimate : estimate)));
    const clientMap = await getClientsById([updatedEstimate.client_id], context);
    return toDetail(updatedEstimate, clientMap.get(updatedEstimate.client_id) ?? null, updatedEstimate.line_items);
  }

  const { client, userId } = requireSupabaseContext(context);
  const { error } = await client.from('estimates').update({ status }).eq('id', id).eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  const detail = await getEstimate(id, context);

  if (!detail) {
    throw new Error('Estimate was updated but could not be loaded.');
  }

  return detail;
}

export async function deleteEstimate(id: string, context: RepositoryContext): Promise<void> {
  if (context.isDemo) {
    const estimates = await readDemoEstimates();
    await writeDemoEstimates(estimates.filter((estimate) => estimate.id !== id));
    return;
  }

  const { client, userId } = requireSupabaseContext(context);
  const { error } = await client.from('estimates').delete().eq('id', id).eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
