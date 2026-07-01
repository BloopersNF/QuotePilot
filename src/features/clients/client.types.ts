export type ClientRecord = {
  address: string | null;
  created_at: string;
  email: string | null;
  id: string;
  name: string;
  notes: string | null;
  phone: string | null;
  updated_at: string;
  user_id: string;
};

export type ClientInput = {
  address: string | null;
  email: string | null;
  name: string;
  notes: string | null;
  phone: string | null;
};
