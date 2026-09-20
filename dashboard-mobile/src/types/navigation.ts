export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Home: undefined;
  AddBranch: undefined;
  AddUser: undefined;
  ItemDetail: { itemId: number };
  BranchStock: { branchId: number; branchName?: string; location?: string };
  AddItem: { item?: any; barcode?: string } | undefined;
  Scanner: { mode: 'lookup' | 'checkout' };
  EventDetail: { eventId: number };
};

export type DrawerParamList = {
  Dashboard: undefined;
  Items: undefined;
  Branches: undefined;
  Checkout: undefined;
  PastCheckouts: undefined;
  Events: undefined;
  Schedule: undefined;
  Notifications: undefined;
  Staff: undefined;
  Users: undefined;
  Report: undefined;
};
