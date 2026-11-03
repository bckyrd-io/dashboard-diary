// Staff NFC data access. Everything is served by the real backend:
//   - employees  -> /api/staff (users table)
//   - workstations -> /api/workstations (created from real tag scans)
//   - check-ins  -> /api/staff/checkins (staff_checkins table)
//   - sales      -> /api/staff/sales (sale events attributed via performance)
// No hardcoded people or timestamps: an error/empty API means nothing to show.

import { api } from './api';

export type Employee = {
  id: number;
  username: string;
  fullName?: string;
  tagId?: string; // optional personal tag
  workstationId?: number;
};

export type Workstation = {
  id: number;
  name: string;
  tagId?: string; // NFC tag attached to workstation
};

export type CheckIn = {
  id: number;
  staffId: number;
  tagId: string;
  workstationId?: number;
  timestamp: string; // ISO
};

export type Sale = {
  id: number;
  staffId: number;
  amount: number;
  timestamp: string;
};

const byNewest = (a: { timestamp: string }, b: { timestamp: string }) =>
  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

export async function getEmployees(): Promise<Employee[]> {
  try {
    const res = await api.get<{ success: boolean; staff?: Employee[] }>('/api/staff');
    if (res?.success && Array.isArray(res.staff)) return res.staff;
  } catch {
    // offline or server error — show nothing rather than fabricated staff
  }
  return [];
}

export async function getWorkstations(): Promise<Workstation[]> {
  try {
    const res = await api.get<{ success: boolean; workstations?: Workstation[] }>('/api/workstations');
    if (res?.success && Array.isArray(res.workstations)) return res.workstations;
  } catch {
    // ignore
  }
  return [];
}

export async function getCheckIns(): Promise<CheckIn[]> {
  try {
    const res = await api.get<{ success: boolean; checkIns?: CheckIn[] }>('/api/staff/checkins');
    if (res?.success && Array.isArray(res.checkIns)) return [...res.checkIns].sort(byNewest);
  } catch {
    // ignore
  }
  return [];
}

export async function getSales(): Promise<Sale[]> {
  try {
    const res = await api.get<{ success: boolean; sales?: Sale[] }>('/api/staff/sales');
    if (res?.success && Array.isArray(res.sales)) return [...res.sales].sort(byNewest);
  } catch {
    // ignore
  }
  return [];
}

export async function addCheckIn(staffId: number, tagId: string, workstationId?: number) {
  const res = await api.post<{ success: boolean; checkIn?: CheckIn; message?: string }>(
    '/api/staff/checkin',
    { staffId, tagId, workstationId, timestamp: new Date().toISOString() }
  );
  if (res?.success && res.checkIn) return res.checkIn;
  throw new Error(res?.message || 'Could not record the check-in.');
}

export async function addSale(staffId: number, amount: number) {
  // Sales come from real checkouts — posted for API compatibility with older
  // call sites, but there is no fake local ledger anymore.
  const res = await api.post<{ success: boolean; sale?: Sale; message?: string }>('/api/staff/sales', {
    staffId,
    amount,
    timestamp: new Date().toISOString(),
  });
  if (res?.success && res.sale) return res.sale;
  throw new Error(res?.message || 'Could not record the sale.');
}

export async function findWorkstationByTag(tagId: string): Promise<Workstation | null> {
  try {
    const res = await api.get<{ success: boolean; workstation?: Workstation | null }>(
      `/api/workstations/by-tag?tag=${encodeURIComponent(tagId)}`
    );
    if (res?.success && res.workstation) return res.workstation;
  } catch {
    // ignore
  }
  return null;
}

export async function getEmployeeById(id: number): Promise<Employee | null> {
  try {
    const res = await api.get<{ success: boolean; staff?: Employee }>(`/api/staff/${id}`);
    if (res?.success && res.staff) return res.staff;
  } catch {
    // ignore
  }
  return null;
}

export async function getCheckInsForStaff(staffId: number): Promise<CheckIn[]> {
  try {
    const res = await api.get<{ success: boolean; checkIns?: CheckIn[] }>(
      `/api/staff/${staffId}/checkins`
    );
    if (res?.success && Array.isArray(res.checkIns)) return [...res.checkIns].sort(byNewest);
  } catch {
    // ignore
  }
  return [];
}

export async function getSalesForStaff(staffId: number): Promise<Sale[]> {
  try {
    const res = await api.get<{ success: boolean; sales?: Sale[] }>(`/api/staff/${staffId}/sales`);
    if (res?.success && Array.isArray(res.sales)) return [...res.sales].sort(byNewest);
  } catch {
    // ignore
  }
  return [];
}

// The logged-in user always exists in /api/staff, so this only needs to
// resolve against what the server returned (kept for call-site compatibility).
export function ensureEmployeeForUsername(username: string, known: Employee[] = []): Employee {
  const existing = known.find((e) => e.username?.toLowerCase() === username.toLowerCase());
  if (existing) return existing;
  return { id: 0, username, fullName: username };
}
