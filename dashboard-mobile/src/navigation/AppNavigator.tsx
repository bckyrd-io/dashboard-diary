import React, { ComponentType } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from '../screens/DashboardScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import StaffScreen from '../screens/StaffScreen';
import ReportScreen from '../screens/ReportScreen';
import LoginScreen from '../screens/LoginScreen';
import LandingScreen from '../screens/LandingScreen';
import BranchesScreen from '../screens/BranchesScreen';
import UsersScreen from '../screens/UsersScreen';
import AddBranchScreen from '../screens/AddBranchScreen';
import AddUserScreen from '../screens/AddUserScreen';
import { useAuth } from '../context/AuthContext';
import { Theme } from '../constants/Theme';
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Folder,
  LayoutDashboard,
  LogOut,
  Map,
  Users,
} from 'lucide-react-native';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

type FarmItem = {
  name: string;
  label: string;
  component: ComponentType<any>;
  Icon: ComponentType<{ size?: number; color?: string }>;
};

const adminItems: FarmItem[] = [
  { name: 'Dashboard', label: 'Home', component: DashboardScreen, Icon: LayoutDashboard },
  { name: 'Branches', label: 'Branch', component: BranchesScreen, Icon: Map },
  { name: 'Activity', label: 'Activity', component: ActivityScreen, Icon: ClipboardList },
  { name: 'Schedule', label: 'Schedule', component: ScheduleScreen, Icon: CalendarDays },
  { name: 'Resources', label: 'Resource', component: ResourcesScreen, Icon: Folder },
  { name: 'Staff', label: 'Performance', component: StaffScreen, Icon: BarChart3 },
  { name: 'Users', label: 'Users', component: UsersScreen, Icon: Users },
  { name: 'Report', label: 'Reports', component: ReportScreen, Icon: BarChart3 },
];

const staffItems = adminItems.filter(({ name }) =>
  ['Activity', 'Schedule', 'Resources'].includes(name)
);

function DrawerMenu({
  role,
  logout,
  navigation,
}: DrawerContentComponentProps & { role: string; logout: () => void }) {
  const items = role === 'admin' ? adminItems : staffItems;

  return (
    <DrawerContentScrollView
      style={{ backgroundColor: Theme.background }}
      contentContainerStyle={{ flex: 1, paddingTop: 8 }}
    >
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Ground</Text>
        <Text style={styles.drawerSub}>Farm Dashboard</Text>
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
        <DrawerItem
          label="Sign out"
          icon={({ color }) => <LogOut size={19} color={color} />}
          onPress={logout}
        />
      </View>
    </DrawerContentScrollView>
  );
}

function FarmDrawer({ role, logout }: { role: string; logout: () => void }) {
  const items = role === 'admin' ? adminItems : staffItems;
  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <DrawerMenu role={role} logout={logout} {...props} />
      )}
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: Theme.muted },
        headerTintColor: Theme.foreground,
        headerStatusBarHeight: 0,
        drawerType: 'front',
        drawerStyle: { width: 280, backgroundColor: Theme.background },
        drawerActiveTintColor: Theme.primary,
        drawerInactiveTintColor: '#4b5563',
        drawerActiveBackgroundColor: Theme.primaryLight,
        drawerLabelStyle: { fontSize: 14, fontWeight: '600', marginLeft: -12 },
        drawerItemStyle: { borderRadius: 6, marginHorizontal: 10, marginVertical: 2 },
      }}
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
        {() => <FarmDrawer role={user.role} logout={logout} />}
      </Stack.Screen>
      {user?.role === 'admin' ? (
        <>
          <Stack.Screen name="AddBranch" component={AddBranchScreen} />
          <Stack.Screen name="AddUser" component={AddUserScreen} />
        </>
      ) : null}
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
    marginTop: 'auto', borderTopWidth: 1, borderTopColor: Theme.border, paddingTop: 8,
  },
});
