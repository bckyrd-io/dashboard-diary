import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { HelpCircle, ShoppingBag } from 'lucide-react-native';
import { Theme } from '../constants/Theme';
import { Button } from '../components/ui';

const SCREENSHOTS: Record<string, ImageSourcePropType> = {
  users: require('../../assets/screenshots/users.png'),
  inventory: require('../../assets/screenshots/inventory.png'),
  analytics: require('../../assets/screenshots/analytics.png'),
  schedule: require('../../assets/screenshots/schedule.png'),
  performance: require('../../assets/screenshots/performance.png'),
  checkout: require('../../assets/screenshots/checkout.png'),
  stock: require('../../assets/screenshots/stock-transfer.png'),
  notifications: require('../../assets/screenshots/notifications.png'),
};

export default function LandingScreen() {
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const helpRef = useRef<View>(null);

  const handleGetStarted = () => {
    navigation.navigate('Login' as never);
  };

  const scrollToHelp = () => {
    helpRef.current?.measureLayout(
      scrollRef.current as any,
      (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true }),
      () => {}
    );
  };

  const renderFeatureCard = (
    title: string,
    description: string,
    screenshot: ImageSourcePropType,
    fallbackEmoji: string
  ) => (
    <View style={styles.featureItem}>
      <View style={styles.featureImageWrap}>
        <Image source={screenshot} style={styles.featureImage} resizeMode="cover" />
        {!screenshot ? <Text style={styles.featureIcon}>{fallbackEmoji}</Text> : null}
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
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
            <Button onPress={handleGetStarted} style={styles.primaryButton}>
              <View style={styles.primaryButtonInner}>
                <ShoppingBag size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </View>
            </Button>

            <TouchableOpacity style={styles.secondaryButton} onPress={scrollToHelp}>
              <HelpCircle size={20} color={Theme.primary} />
              <Text style={styles.secondaryButtonText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection} ref={helpRef}>
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
            {renderFeatureCard('User Management', 'Create, edit, and deactivate user accounts. Assign roles and permissions to staff members.', SCREENSHOTS.users, '👷')}
            {renderFeatureCard('Inventory Management', 'Manage shoe catalog with categories, pricing, stock levels, and barcode tracking.', SCREENSHOTS.inventory, '👟')}
            {renderFeatureCard('Financial Analytics', 'Record revenue and expenses. Generate profit reports and financial analyses with visual charts.', SCREENSHOTS.analytics, '📈')}
            {renderFeatureCard('Schedule Management', 'Create and assign work schedules to staff members. Set recurring activities and manage calendar events.', SCREENSHOTS.schedule, '📅')}
            {renderFeatureCard('Staff Performance', 'Monitor productivity metrics and generate performance reports for individual staff members.', SCREENSHOTS.performance, '📊')}
          </View>

          {/* Staff Features */}
          <View style={styles.featureSection}>
            <Text style={styles.subsectionTitle}>Staff Features</Text>
            <Text style={styles.subsectionDescription}>
              Store staff members have focused access to tools for daily operations,
              processing sales, and managing inventory.
            </Text>
            {renderFeatureCard('Checkout Processing', 'Process customer sales with multiple payment methods including mobile money.', SCREENSHOTS.checkout, '💳')}
            {renderFeatureCard('Stock Management', 'View inventory levels, process stock transfers, and receive new shipments.', SCREENSHOTS.stock, '📦')}
            {renderFeatureCard('Notification Center', 'Receive updates on low stock alerts, payment confirmments, and schedule changes.', SCREENSHOTS.notifications, '🔔')}
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
  primaryButton: { flex: 1 },
  primaryButtonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondaryButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Theme.background, borderWidth: 1, borderColor: Theme.border,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, minHeight: 44, gap: 8,
  },
  secondaryButtonText: { color: Theme.foreground, fontSize: 15, fontWeight: '600' },
  helpSection: { paddingBottom: 40 },
  sectionTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: Theme.foreground },
  sectionDescription: { fontSize: 16, color: '#4b5563', lineHeight: 24, marginBottom: 32 },
  featureSection: { marginBottom: 32 },
  subsectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: Theme.primary },
  subsectionDescription: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 20 },
  featureItem: { marginBottom: 20 },
  featureImageWrap: {
    width: '100%',
    height: 180,
    borderRadius: Theme.radius,
    backgroundColor: Theme.background,
    borderWidth: 1,
    borderColor: Theme.border,
    overflow: 'hidden',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  featureIcon: { fontSize: 40 },
  featureTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, color: Theme.primary },
  featureDescription: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
});
