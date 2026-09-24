import React, { ComponentType } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from '../screens/DashboardScreen';
import ItemsScreen from '../screens/ItemsScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import AddItemScreen from '../screens/AddItemScreen';
import BranchesScreen from '../screens/BranchesScreen';
import BranchStockScreen from '../screens/BranchStockScreen';
import AddBranchScreen from '../screens/AddBranchScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ScannerScreen from '../screens/ScannerScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import UsersScreen from '../screens/UsersScreen';
import AddUserScreen from '../screens/AddUserScreen';
import StaffScreen from '../screens/StaffScreen';
import StaffActivityScreen from '../screens/StaffActivityScreen';
import LoginScreen from '../screens/LoginScreen';
import LandingScreen from '../screens/LandingScreen';
import { useAuth } from '../context/AuthContext';
import { Theme } from '../constants/Theme';
import {
  BarChart3,
  Building,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Tag,
  Users,
  PanelLeft,
} from 'lucide-react-native';


const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

type NavItem = {
  name: string;
  label: string;
  component: ComponentType<any>;
  Icon: ComponentType<{ size?: number; color?: string }>;
};

const adminItems: NavItem[] = [
  { name: 'Dashboard', label: 'Dashboard', component: DashboardScreen, Icon: LayoutDashboard },
  { name: 'Items', label: 'Items', component: ItemsScreen, Icon: Tag },
  { name: 'Checkout', label: 'Checkout', component: CheckoutScreen, Icon: CreditCard },
  { name: 'Branches', label: 'Branches', component: BranchesScreen, Icon: Building },
  { name: 'Schedule', label: 'Schedule', component: ScheduleScreen, Icon: CalendarDays },
  { name: 'Staff', label: 'Performance', component: StaffScreen, Icon: BarChart3 },
  { name: 'Users', label: 'Users', component: UsersScreen, Icon: Users },
];

const cashierItems: NavItem[] = [
  { name: 'Items', label: 'Items', component: ItemsScreen, Icon: Tag },
  { name: 'Checkout', label: 'Checkout', component: CheckoutScreen, Icon: CreditCard },
  { name: 'Schedule', label: 'Schedule', component: ScheduleScreen, Icon: CalendarDays },
];

const staffItems: NavItem[] = [
  { name: 'Items', label: 'Items', component: ItemsScreen, Icon: Tag },
  { name: 'Schedule', label: 'Schedule', component: ScheduleScreen, Icon: CalendarDays },
];

function DrawerMenu({
  role,
  logout,
  user,
  navigation,
}: DrawerContentComponentProps & { role: string; logout: () => void; user: { username: string; role: string } }) {
  let items: NavItem[];
  if (role === 'admin') {
    items = adminItems;
  } else if (role === 'Cashier') {
    items = cashierItems;
  } else {
    items = staffItems;
  }

  return (
    <DrawerContentScrollView
      style={{ backgroundColor: Theme.background }}
      contentContainerStyle={{ flex: 1, paddingTop: 8 }}
    >
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>The Sneaker Lounge</Text>
        <Text style={styles.drawerSub}>Mobile Retail Store Erp</Text>
      </View>
      {items.map(({ name, label, Icon }) => (
        <DrawerItem
          key={name}
          label={label}
          icon={({ color }) => <Icon size={19} color={color} />}
          onPress={() => navigation.navigate(name)}
        />
      ))}
      <View style={styles.drawerFooter}>
        <View style={styles.footerRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{user.username[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.userName} numberOfLines={1}>{user.username}</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <LogOut size={16} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

function StoreDrawer({ role, logout, user }: { role: string; logout: () => void; user: { username: string; role: string } }) {
  let items: NavItem[];
  if (role === 'admin') {
    items = adminItems;
  } else if (role === 'Cashier') {
    items = cashierItems;
  } else {
    items = staffItems;
  }

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <DrawerMenu role={role} logout={logout} user={user} {...props} />
      )}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: Theme.muted },
        headerTintColor: Theme.foreground,
        headerStatusBarHeight: 0,
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.toggleDrawer && navigation.toggleDrawer()} style={{ marginLeft: 12 }}>
            <PanelLeft size={24} color={Theme.foreground} />
          </TouchableOpacity>
        ),
        drawerType: 'front',
        drawerStyle: { width: 280, backgroundColor: Theme.background },
        drawerActiveTintColor: Theme.primary,
        drawerInactiveTintColor: '#4b5563',
        drawerActiveBackgroundColor: Theme.primaryLight,
        drawerLabelStyle: { fontSize: 14, fontWeight: '600', marginLeft: -12 },
        drawerItemStyle: { borderRadius: 6, marginHorizontal: 10, marginVertical: 2 },
      })}
    >
      {items.map(({ name, component: Component, label }) => (
        <Drawer.Screen
          key={name}
          name={name}
          component={Component}
          options={{ title: label }}
        />
      ))}
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home">
        {() => <StoreDrawer role={user.role} logout={logout} user={{ username: user.username, role: user.role }} />}
      </Stack.Screen>
      {user?.role === 'admin' && (
        <>
          <Stack.Screen name="AddBranch" component={AddBranchScreen} />
          <Stack.Screen name="AddUser" component={AddUserScreen} />
        </>
      )}
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="BranchStock" component={BranchStockScreen} />
      <Stack.Screen name="AddItem" component={AddItemScreen} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="StaffActivity" component={StaffActivityScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    paddingHorizontal: 20, paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: Theme.border, marginBottom: 8,
  },
  drawerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.gray900 },
  drawerSub: { fontSize: 12, color: Theme.mutedForeground, marginTop: 4 },
  drawerFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Theme.foreground,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.destructive,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius,
    gap: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
