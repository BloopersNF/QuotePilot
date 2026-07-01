import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase/client';

import type { ClientInput, ClientRecord } from './client.types';

type RepositoryContext = {
  isDemo: boolean;
  userId?: string;
};

const DEMO_CLIENTS_KEY = 'quotepilot:demo:clients';

const seedClients: ClientRecord[] = [
  {
    address: '145 King Street, Hamilton, ON',
    created_at: '2026-06-29T15:00:00.000Z',
    email: 'jamie@example.com',
    id: 'demo-client-1',
    name: 'Jamie Carter',
    notes: 'Prefers text updates and weekday appointments.',
    phone: '+1 555 0148',
    updated_at: '2026-06-29T15:00:00.000Z',
    user_id: 'demo-user',
  },
  {
    address: '88 Willow Lane, Burlington, ON',
    created_at: '2026-06-28T18:30:00.000Z',
    email: null,
    id: 'demo-client-2',
    name: 'Northview Bakery',
    notes: 'Ask for Priya when scheduling site visits.',
    phone: '+1 555 0182',
    updated_at: '2026-06-28T18:30:00.000Z',
    user_id: 'demo-user',
  },
];

function requireSupabaseContext(context: RepositoryContext) {
  if (!context.userId) {
    throw new Error('You need to be logged in to manage clients.');
  }

  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return { client: supabase, userId: context.userId };
}

function normalizeClientInput(values: ClientInput): ClientInput {
  return {
    address: values.address,
    email: values.email,
    name: values.name,
    notes: values.notes,
    phone: values.phone,
  };
}

function sortClients(clients: ClientRecord[]) {
  return [...clients].sort((first, second) => second.created_at.localeCompare(first.created_at));
}

async function readDemoClients() {
  const stored = await AsyncStorage.getItem(DEMO_CLIENTS_KEY);

  if (!stored) {
    await AsyncStorage.setItem(DEMO_CLIENTS_KEY, JSON.stringify(seedClients));
    return seedClients;
  }

  return JSON.parse(stored) as ClientRecord[];
}

async function writeDemoClients(clients: ClientRecord[]) {
  await AsyncStorage.setItem(DEMO_CLIENTS_KEY, JSON.stringify(clients));
}

function createDemoId() {
  return `demo-client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listClients(context: RepositoryContext): Promise<ClientRecord[]> {
  if (context.isDemo) {
    return sortClients(await readDemoClients());
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data, error } = await client
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ClientRecord[]) ?? [];
}

export async function getClient(id: string, context: RepositoryContext): Promise<ClientRecord | null> {
  if (context.isDemo) {
    const clients = await readDemoClients();
    return clients.find((client) => client.id === id) ?? null;
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data, error } = await client
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ClientRecord | null) ?? null;
}

export async function createClient(values: ClientInput, context: RepositoryContext): Promise<ClientRecord> {
  if (context.isDemo) {
    const clients = await readDemoClients();
    const now = new Date().toISOString();
    const nextClient: ClientRecord = {
      ...normalizeClientInput(values),
      created_at: now,
      id: createDemoId(),
      updated_at: now,
      user_id: 'demo-user',
    };

    await writeDemoClients([nextClient, ...clients]);
    return nextClient;
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data, error } = await client
    .from('clients')
    .insert({
      ...normalizeClientInput(values),
      user_id: userId,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ClientRecord;
}

export async function updateClient(id: string, values: ClientInput, context: RepositoryContext): Promise<ClientRecord> {
  if (context.isDemo) {
    const clients = await readDemoClients();
    const existingClient = clients.find((client) => client.id === id);

    if (!existingClient) {
      throw new Error('Client not found.');
    }

    const updatedClient: ClientRecord = {
      ...existingClient,
      ...normalizeClientInput(values),
      updated_at: new Date().toISOString(),
    };

    await writeDemoClients(clients.map((client) => (client.id === id ? updatedClient : client)));
    return updatedClient;
  }

  const { client, userId } = requireSupabaseContext(context);
  const { data, error } = await client
    .from('clients')
    .update(normalizeClientInput(values))
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ClientRecord;
}

export async function deleteClient(id: string, context: RepositoryContext): Promise<void> {
  if (context.isDemo) {
    const clients = await readDemoClients();
    await writeDemoClients(clients.filter((client) => client.id !== id));
    return;
  }

  const { client, userId } = requireSupabaseContext(context);
  const { error } = await client.from('clients').delete().eq('id', id).eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
