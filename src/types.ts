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
  date: string;
  time: string;
  items: ReservationItemDetail[];
  totalPrice: number;
  notes?: string;
}