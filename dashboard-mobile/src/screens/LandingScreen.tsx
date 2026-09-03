import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HelpCircle, Notebook } from 'lucide-react-native';
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
      <Text style={styles.featureDesc}>{description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={styles.heroRow}>
            <Text style={styles.heroEmoji}>🌱</Text>
            <Text style={styles.heroTitle}>Diary Dashboard</Text>
          </View>

          <Text style={styles.heroDesc}>
            The Farm Management System helps farm admins manage users, schedule activities, track performance, and analyze financial data, while staff can log activities, view schedules, and request inventory.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={handleGetStarted}
              style={styles.getStartedBtn}
            >
              <Notebook size={20} color="#fff" />
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={scrollToHelp}
              style={styles.helpBtn}
            >
              <HelpCircle size={20} color={Theme.primary} />
              <Text style={styles.helpText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>User Guide</Text>
          <Text style={styles.guideDesc}>
            This guide provides an overview of system functionalities, installation steps, and user roles.
          </Text>

          <View style={styles.featuresBlock}>
            <Text style={styles.sectionTitle}>Admin Features</Text>
            <Text style={styles.sectionDesc}>
              Farm administrators have full access to manage the entire system, including users, activities, finances, and reporting.
            </Text>

            {renderFeatureCard(
              'User Management',
              'Create, edit, and deactivate user accounts. Assign roles and permissions to staff members.',
              '👷'
            )}
            {renderFeatureCard(
              'Financial Analytics',
              'Record revenue and expenses. Generate profit reports and financial analyses with visual charts.',
              '📈'
            )}
            {renderFeatureCard(
              'Schedule Management',
              'Create and assign work schedules to staff members. Set recurring activities and manage calendar events.',
              '📅'
            )}
            {renderFeatureCard(
              'Staff Performance',
              'Monitor productivity metrics and generate performance reports for individual staff members.',
              '📊'
            )}
            {renderFeatureCard(
              'Generate Report',
              'Generate comprehensive reports on farm operations, finances, and staff performance with export options.',
              '📋'
            )}
          </View>

          <View style={styles.featuresBlock}>
            <Text style={styles.sectionTitle}>Staff Features</Text>
            <Text style={styles.sectionDesc}>
              Farm staff members have focused access to tools for daily activities, viewing schedules, and managing basic operational needs.
            </Text>

            {renderFeatureCard(
              'Activity Logging',
              'Record daily activities with details on time spent, resources used, and outcomes achieved.',
              '🌾'
            )}
            {renderFeatureCard(
              'Resource Requests',
              'Submit requests for required supplies, tools, and equipment with detailed justifications.',
              '📦'
            )}
            {renderFeatureCard(
              'Notification Center',
              'Receive updates on schedule changes, request approvals, and system announcements in real-time.',
              '🔔'
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 20,
  },
  heroSection: {
    paddingTop: 40,
    paddingBottom: 40,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.primary,
  },
  heroDesc: {
    fontSize: 16,
    color: Theme.gray500,
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  getStartedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  getStartedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: Theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  helpText: {
    color: Theme.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  guideSection: {
    paddingBottom: 40,
  },
  guideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Theme.gray900,
  },
  guideDesc: {
    fontSize: 16,
    color: Theme.gray500,
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresBlock: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: Theme.primary,
  },
  sectionDesc: {
    fontSize: 15,
    color: Theme.gray500,
    lineHeight: 20,
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: Theme.gray50,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.gray200,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Theme.primary,
  },
  featureDesc: {
    fontSize: 14,
    color: Theme.gray500,
    lineHeight: 20,
  },
});
