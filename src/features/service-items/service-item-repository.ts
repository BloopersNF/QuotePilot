import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase/client';

import type { ServiceItemInput, ServiceItemRecord } from './service-item.types';

type RepositoryContext = {
  isDemo: boolean;
  userId?: string;
};

const DEMO_SERVICE_ITEMS_KEY = 'quotepilot:demo:service-items';

const seedServiceItems: ServiceItemRecord[] = [
  {
    category: 'labor',
    created_at: '2026-06-29T16:00:00.000Z',
    default_price_minor: 9500,
    description: 'Standard skilled labor for on-site work.',
    id: 'demo-service-item-1',
    name: 'Hourly labor',
    taxable: true,
    unit_type: 'hour',
    updated_at: '2026-06-29T16:00:00.000Z',
    user_id: 'demo-user',
  },
  {
    category: 'service',
    created_at: '2026-06-28T16:00:00.000Z',
    default_price_minor: 22500,
    description: 'Fixed trip and setup charge for small jobs.',
    id: 'demo-service-item-2',
    name: 'Service call',
    taxable: true,
    unit_type: 'fixed',
    updated_at: '2026-06-28T16:00:00.000Z',
    user_id: 'demo-user',
  },
];

function requireSupabaseContext(context: RepositoryContext) {
  if (!context.userId) {
    throw new Error('You need to be logged in to manage service items.');
  }

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return { client: supabase, userId: context.userId };
}

function sortServiceItems(serviceItems: ServiceItemRecord[]) {
  return [...serviceItems].sort((first, second) => second.created_at.localeCompare(first.created_at));
}

async function readDemoServiceItems() {
  const stored = await AsyncStorage.getItem(DEMO_SERVICE_ITEMS_KEY);

  if (!stored) {
    await AsyncStorage.setItem(DEMO_SERVICE_ITEMS_KEY, JSON.stringify(seedServiceItems));
    return seedServiceItems;
  }

  return JSON.parse(stored) as ServiceItemRecord[];
}

async function writeDemoServiceItems(serviceItems: ServiceItemRecord[]) {
  await AsyncStorage.setItem(DEMO_SERVICE_ITEMS_KEY, JSON.stringify(serviceItems));
}

function createDemoId() {
  return `demo-service-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listServiceItems(context: RepositoryContext): Promise<ServiceItemRecord[]> {
  if (context.isDemo) {
    return sortServiceItems(await readDemoServiceItems());
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data, error } = await client
    .from('service_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ServiceItemRecord[]) ?? [];
}

export async function getServiceItem(id: string, context: RepositoryContext): Promise<ServiceItemRecord | null> {
  if (context.isDemo) {
    const serviceItems = await readDemoServiceItems();
    return serviceItems.find((serviceItem) => serviceItem.id === id) ?? null;
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data, error } = await client
    .from('service_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ServiceItemRecord | null) ?? null;
}

export async function createServiceItem(
  values: ServiceItemInput,
  context: RepositoryContext,
): Promise<ServiceItemRecord> {
  if (context.isDemo) {
    const serviceItems = await readDemoServiceItems();
    const now = new Date().toISOString();
    const nextServiceItem: ServiceItemRecord = {
      ...values,
      created_at: now,
      id: createDemoId(),
      updated_at: now,
      user_id: 'demo-user',
    };

    await writeDemoServiceItems([nextServiceItem, ...serviceItems]);
    return nextServiceItem;
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data, error } = await client
    .from('service_items')
    .insert({
      ...values,
      user_id: userId,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ServiceItemRecord;
}

export async function updateServiceItem(
  id: string,
  values: ServiceItemInput,
  context: RepositoryContext,
): Promise<ServiceItemRecord> {
  if (context.isDemo) {
    const serviceItems = await readDemoServiceItems();
    const existingServiceItem = serviceItems.find((serviceItem) => serviceItem.id === id);

    if (!existingServiceItem) {
      throw new Error('Service item not found.');
    }

    const updatedServiceItem: ServiceItemRecord = {
      ...existingServiceItem,
      ...values,
      updated_at: new Date().toISOString(),
    };

    await writeDemoServiceItems(
      serviceItems.map((serviceItem) => (serviceItem.id === id ? updatedServiceItem : serviceItem)),
    );
    return updatedServiceItem;
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data, error } = await client
    .from('service_items')
    .update(values)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ServiceItemRecord;
}

export async function deleteServiceItem(id: string, context: RepositoryContext): Promise<void> {
  if (context.isDemo) {
    const serviceItems = await readDemoServiceItems();
    await writeDemoServiceItems(serviceItems.filter((serviceItem) => serviceItem.id !== id));
    return;
  }

  const { client, userId } = requireSupabaseContext(context);
  const { error } = await client.from('service_items').delete().eq('id', id).eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
