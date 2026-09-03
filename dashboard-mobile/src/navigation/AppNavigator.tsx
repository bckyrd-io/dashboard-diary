import React, { ComponentType } from 'react';
<<<<<<< Updated upstream
import { StyleSheet, Text, View } from 'react-native';
=======
import { Text, View } from 'react-native';
>>>>>>> Stashed changes
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
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
<<<<<<< Updated upstream
import { Theme } from '../constants/Theme';
=======
>>>>>>> Stashed changes
import { BarChart3, CalendarDays, ClipboardList, Folder, LayoutDashboard, LogOut, Map, Users } from 'lucide-react-native';

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

const staffItems = adminItems.filter(({ name }) => ['Activity', 'Schedule', 'Resources'].includes(name));

function DrawerMenu({ role, logout, navigation }: DrawerContentComponentProps & { role: string; logout: () => void }) {
  const items = role === 'admin' ? adminItems : staffItems;

  return (
<<<<<<< Updated upstream
    <DrawerContentScrollView contentContainerStyle={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Ground</Text>
        <Text style={styles.drawerSubtitle}>Farm Dashboard</Text>
=======
    <DrawerContentScrollView className="bg-white" contentContainerClassName="flex-1 pt-2">
      <View className="px-5 py-5 border-b border-gray-200 mb-2">
        <Text className="text-lg font-bold text-gray-950">Ground</Text>
        <Text className="text-xs text-gray-500 mt-1">Farm Dashboard</Text>
>>>>>>> Stashed changes
      </View>
      {items.map(({ name, label, Icon }) => (
        <DrawerItem key={name} label={label} icon={({ color }) => <Icon size={19} color={color} />} onPress={() => navigation.navigate(name)} />
      ))}
<<<<<<< Updated upstream
      <View style={styles.drawerFooter}>
=======
      <View className="mt-auto border-t border-gray-200 pt-2">
>>>>>>> Stashed changes
        <DrawerItem label="Sign out" icon={({ color }) => <LogOut size={19} color={color} />} onPress={logout} />
      </View>
    </DrawerContentScrollView>
  );
}

function FarmDrawer({ role, logout }: { role: string; logout: () => void }) {
  const items = role === 'admin' ? adminItems : staffItems;
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerMenu role={role} logout={logout} {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerShadowVisible: false,
<<<<<<< Updated upstream
        headerStyle: { backgroundColor: Theme.gray50 },
        headerTintColor: Theme.foreground,
        headerStatusBarHeight: 0,
        drawerType: 'front',
        drawerStyle: { width: 280, backgroundColor: Theme.background },
        drawerActiveTintColor: Theme.primary,
        drawerInactiveTintColor: Theme.gray600,
        drawerActiveBackgroundColor: Theme.primaryLight,
=======
        headerStyle: { backgroundColor: '#f9fafb' },
        headerTintColor: '#111827',
        headerStatusBarHeight: 0,
        drawerType: 'front',
        drawerStyle: { width: 280, backgroundColor: '#fff' },
        drawerActiveTintColor: '#33b76d',
        drawerInactiveTintColor: '#4b5563',
        drawerActiveBackgroundColor: '#e8f8f0',
>>>>>>> Stashed changes
        drawerLabelStyle: { fontSize: 14, fontWeight: '600', marginLeft: -12 },
        drawerItemStyle: { borderRadius: 6, marginHorizontal: 10, marginVertical: 2 },
      }}
    >
      {items.map(({ name, component: Component, label }) => <Drawer.Screen key={name} name={name} component={Component} options={{ title: label }} />)}
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home">{() => <FarmDrawer role={user.role} logout={logout} />}</Stack.Screen>
      {user?.role === 'admin' ? (
        <>
          <Stack.Screen name="AddBranch" component={AddBranchScreen} />
          <Stack.Screen name="AddUser" component={AddUserScreen} />
        </>
      ) : null}
    </Stack.Navigator>
  );
}
<<<<<<< Updated upstream

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.gray200,
    marginBottom: 8,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.gray900,
  },
  drawerSubtitle: {
    fontSize: 12,
    color: Theme.gray500,
    marginTop: 4,
  },
  drawerFooter: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: Theme.gray200,
    paddingTop: 8,
  },
});
=======
>>>>>>> Stashed changes
