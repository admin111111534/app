export interface WarehouseItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
}

export interface ReservationItemDetail {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface ReservationItem {
  id: string;
  clientName: string;
  location: string;
  dateFrom: string; // npr. "2025-09-12"
  dateTo: string;   // npr. "2025-09-13"
  time: string;
  items: ReservationItemDetail[];
  totalPrice: number;
  notes?: string;
  status?: 'active' | 'finished';
}