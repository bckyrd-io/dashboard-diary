import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HelpCircle, ShoppingBag } from 'lucide-react-native';
import { Theme } from '../constants/Theme';

export default function LandingScreen() {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate('Login' as never);
  };

  const scrollToHelp = () => {
    alert('Help section is below!');
  };

  const renderFeatureCard = (title: string, description: string, icon: string) => (
    <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>👟</Text>
            <Text style={styles.logoLabel}>The Sneaker Lounge</Text>
          </View>

          <Text style={styles.description}>
            The Sneaker Lounge Management System helps store admins manage users,
            process sales, track inventory, and analyze performance, while staff
            can process checkouts, view schedules, and manage stock.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
              <ShoppingBag size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={scrollToHelp}>
              <HelpCircle size={20} color={Theme.primary} />
              <Text style={styles.secondaryButtonText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.sectionTitle}>User Guide</Text>
          <Text style={styles.sectionDescription}>
            This guide provides an overview of system functionalities, installation
            steps, and user roles.
          </Text>

          {/* Admin Features */}
          <View style={styles.featureSection}>
            <Text style={styles.subsectionTitle}>Admin Features</Text>
            <Text style={styles.subsectionDescription}>
              Store administrators have full access to manage the entire system,
              including users, inventory, finances, and reporting.
            </Text>
            {renderFeatureCard('User Management', 'Create, edit, and deactivate user accounts. Assign roles and permissions to staff members.', '👷')}
            {renderFeatureCard('Inventory Management', 'Manage shoe catalog with categories, pricing, stock levels, and barcode tracking.', '👟')}
            {renderFeatureCard('Financial Analytics', 'Record revenue and expenses. Generate profit reports and financial analyses with visual charts.', '📈')}
            {renderFeatureCard('Schedule Management', 'Create and assign work schedules to staff members. Set recurring activities and manage calendar events.', '📅')}
            {renderFeatureCard('Staff Performance', 'Monitor productivity metrics and generate performance reports for individual staff members.', '📊')}
          </View>

          {/* Staff Features */}
          <View style={styles.featureSection}>
            <Text style={styles.subsectionTitle}>Staff Features</Text>
            <Text style={styles.subsectionDescription}>
              Store staff members have focused access to tools for daily operations,
              processing sales, and managing inventory.
            </Text>
            {renderFeatureCard('Checkout Processing', 'Process customer sales with multiple payment methods including mobile money.', '💳')}
            {renderFeatureCard('Stock Management', 'View inventory levels, process stock transfers, and receive new shipments.', '📦')}
            {renderFeatureCard('Notification Center', 'Receive updates on low stock alerts, payment confirmments, and schedule changes.', '🔔')}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scrollContent: { padding: 20 },
  heroSection: { paddingTop: 40, paddingBottom: 40 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logoText: { fontSize: 40, marginRight: 12 },
  logoLabel: { fontSize: 24, fontWeight: 'bold', color: Theme.primary },
  description: { fontSize: 16, color: '#4b5563', lineHeight: 24, marginBottom: 32 },
  buttonContainer: { flexDirection: 'row', gap: 12 },
  primaryButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Theme.primary, paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: Theme.radius, gap: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Theme.background, borderWidth: 2, borderColor: Theme.primary,
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: Theme.radius, gap: 8,
  },
  secondaryButtonText: { color: Theme.primary, fontSize: 16, fontWeight: '600' },
  helpSection: { paddingBottom: 40 },
  sectionTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: Theme.foreground },
  sectionDescription: { fontSize: 16, color: '#4b5563', lineHeight: 24, marginBottom: 32 },
  featureSection: { marginBottom: 32 },
  subsectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: Theme.primary },
  subsectionDescription: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 20 },
  featureCard: {
    backgroundColor: Theme.muted, borderRadius: Theme.radius, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: Theme.border,
  },
  featureIcon: { fontSize: 32, marginBottom: 12 },
  featureTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, color: Theme.primary },
  featureDescription: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
});
