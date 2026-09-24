// In-memory seed data and simple helpers for Staff NFC dashboard

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

let employees: Employee[] = [
  { id: 1, username: 'alice', fullName: 'Alice Morales', workstationId: 1 },
  { id: 2, username: 'brad', fullName: 'Brad Chen', workstationId: 2 },
  { id: 3, username: 'carla', fullName: 'Carla Diaz', workstationId: 3 },
  { id: 4, username: 'dave', fullName: 'Dave Patel', workstationId: 4 },
];

let workstations: Workstation[] = [
  { id: 1, name: 'Register 1', tagId: 'WS-A1' },
  { id: 2, name: 'Register 2', tagId: 'WS-B2' },
  { id: 3, name: 'Sneaker Table', tagId: 'WS-C3' },
  { id: 4, name: 'Returns Desk', tagId: 'WS-D4' },
];

// Seed recent check-ins: times spread so statuses include Active, Idle, Needs Check
const now = Date.now();

let checkIns: CheckIn[] = [
  { id: 1, staffId: 1, tagId: 'WS-A1', workstationId: 1, timestamp: new Date(now - 5 * 60 * 1000).toISOString() }, // 5m ago -> Active
  { id: 2, staffId: 2, tagId: 'WS-B2', workstationId: 2, timestamp: new Date(now - 20 * 60 * 1000).toISOString() }, // 20m -> Idle
  { id: 3, staffId: 3, tagId: 'WS-C3', workstationId: 3, timestamp: new Date(now - 90 * 60 * 1000).toISOString() }, // 90m -> Needs Check
  // older check for Dave
  { id: 4, staffId: 4, tagId: 'WS-D4', workstationId: 4, timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString() },
];

let sales: Sale[] = [
  { id: 1, staffId: 1, amount: 125.0, timestamp: new Date(now - 40 * 60 * 1000).toISOString() },
  { id: 2, staffId: 1, amount: 80.5, timestamp: new Date(now - 15 * 60 * 1000).toISOString() },
  { id: 3, staffId: 2, amount: 40.0, timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
  { id: 4, staffId: 3, amount: 220.0, timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString() },
  { id: 5, staffId: 2, amount: 60.0, timestamp: new Date(now - 10 * 60 * 1000).toISOString() },
];

let nextCheckInId = 5;
let nextSaleId = 6;

import { api } from './api';

export async function getEmployees() {
  try {
    const res = await api.get<{ success: boolean; staff: any[] }>('/api/staff');
    if (res && (res as any).staff) return (res as any).staff;
  } catch (err) {
    // ignore and fall back to local
  }
  return employees.slice();
}

export async function getWorkstations() {
  try {
    const res = await api.get<{ success: boolean; workstations: any[] }>('/api/workstations');
    if (res && (res as any).workstations) return (res as any).workstations;
  } catch (err) {
    // ignore and fall back
  }
  return workstations.slice();
}

export async function getCheckIns() {
  try {
    const res = await api.get<{ success: boolean; checkIns: any[] }>('/api/staff/checkins');
    if (res && (res as any).checkIns) return (res as any).checkIns.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    // ignore
  }
  return checkIns.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getSales() {
  try {
    const res = await api.get<{ success: boolean; sales: any[] }>('/api/staff/sales');
    if (res && (res as any).sales) return (res as any).sales.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    // ignore
  }
  return sales.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addCheckIn(staffId: number, tagId: string, workstationId?: number) {
  try {
    const res = await api.post('/api/staff/checkin', { staffId, tagId, workstationId, timestamp: new Date().toISOString() });
    if (res && (res as any).success) return (res as any).checkIn;
  } catch (err) {
    // fall back to in-memory
  }

  const newItem: CheckIn = {
    id: nextCheckInId++,
    staffId,
    tagId,
    workstationId,
    timestamp: new Date().toISOString(),
  };
  checkIns.push(newItem);
  return newItem;
}

export async function addSale(staffId: number, amount: number) {
  try {
    const res = await api.post('/api/staff/sales', { staffId, amount, timestamp: new Date().toISOString() });
    if (res && (res as any).success) return (res as any).sale;
  } catch (err) {
    // fall back
  }

  const newSale: Sale = { id: nextSaleId++, staffId, amount, timestamp: new Date().toISOString() };
  sales.push(newSale);
  return newSale;
}

export async function findWorkstationByTag(tagId: string) {
  try {
    const res = await api.get(`/api/workstations/by-tag?tag=${encodeURIComponent(tagId)}`);
    if ((res as any)?.workstation) return (res as any).workstation;
  } catch (err) {}
  return workstations.find((w) => w.tagId === tagId);
}

export async function getEmployeeById(id: number) {
  try {
    const res = await api.get(`/api/staff/${id}`);
    if ((res as any)?.staff) return (res as any).staff;
  } catch (err) {}
  return employees.find((e) => e.id === id) || null;
}

export async function getCheckInsForStaff(staffId: number) {
  try {
    const res = await api.get(`/api/staff/${staffId}/checkins`);
    if ((res as any)?.checkIns) return (res as any).checkIns.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {}
  return checkIns.filter((c) => c.staffId === staffId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getSalesForStaff(staffId: number) {
  try {
    const res = await api.get(`/api/staff/${staffId}/sales`);
    if ((res as any)?.sales) return (res as any).sales.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {}
  return sales.filter((s) => s.staffId === staffId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function ensureEmployeeForUsername(username: string) {
  let emp = employees.find((e) => e.username === username);
  if (!emp) {
    const id = employees.length + 1 + Math.floor(Math.random() * 100);
    emp = { id, username, fullName: username, workstationId: undefined };
    employees.push(emp);
  }
  return emp;
}
