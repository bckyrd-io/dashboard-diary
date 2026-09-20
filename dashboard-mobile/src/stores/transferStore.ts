export interface SelectedTransferItem {
  itemId: number;
  name: string;
  price: number;
  quantity: number;
  maxQuantity: number;
}

interface PendingTransfer {
  items: SelectedTransferItem[];
  sourceBranchId: number;
  sourceBranchName: string;
}

let pending: PendingTransfer | null = null;

export function setPendingTransfer(data: PendingTransfer) {
  pending = data;
}

export function getPendingTransfer(): PendingTransfer | null {
  return pending;
}

export function clearPendingTransfer() {
  pending = null;
}
