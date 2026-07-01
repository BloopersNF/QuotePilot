export const serviceItemUnitTypes = ['hour', 'fixed', 'item', 'day'] as const;
export const serviceItemCategories = ['labor', 'material', 'service', 'fee', 'other'] as const;

export type ServiceItemUnitType = (typeof serviceItemUnitTypes)[number];
export type ServiceItemCategory = (typeof serviceItemCategories)[number];

export type ServiceItemRecord = {
  category: ServiceItemCategory;
  created_at: string;
  default_price_minor: number;
  description: string | null;
  id: string;
  name: string;
  taxable: boolean;
  unit_type: ServiceItemUnitType;
  updated_at: string;
  user_id: string;
};

export type ServiceItemInput = {
  category: ServiceItemCategory;
  default_price_minor: number;
  description: string | null;
  name: string;
  taxable: boolean;
  unit_type: ServiceItemUnitType;
};
