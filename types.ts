
export interface Shipment {
  id: string;
  productName: string;
  quantity: string;
  destination: string;
  shipDate: string;
  customerName: string;
  isPemex: boolean;
  isHazmat: boolean;
  status: 'draft' | 'in-progress' | 'ready' | 'shipped';
  createdAt: string;
  documentChecklist: DocumentChecklistItem[];
  aiReport?: string;
}

export interface DocumentChecklistItem {
  name: string;
  preparer: string;
  isCompleted: boolean;
  description: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CREATE_SHIPMENT = 'CREATE_SHIPMENT',
  SHIPMENT_DETAIL = 'SHIPMENT_DETAIL',
  CHAT = 'CHAT'
}
