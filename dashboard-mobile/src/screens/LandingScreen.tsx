<<<<<<< Updated upstream
import React from 'react';
=======
import React, { useState } from 'react';
>>>>>>> Stashed changes
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
<<<<<<< Updated upstream
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HelpCircle, Notebook } from 'lucide-react-native';
import { Theme } from '../constants/Theme';
=======
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HelpCircle, Notebook } from 'lucide-react-native';
>>>>>>> Stashed changes

export default function LandingScreen() {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate('Login' as never);
  };

  const scrollToHelp = () => {
<<<<<<< Updated upstream
=======
    // In a real implementation, we would scroll to the help section
    // For now, we'll just show an alert
>>>>>>> Stashed changes
    alert('Help section is below!');
  };

  const renderFeatureCard = (title: string, description: string, icon: string) => (
    <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
<<<<<<< Updated upstream
      <Text style={styles.featureDesc}>{description}</Text>
=======
      <Text style={styles.featureDescription}>{description}</Text>
>>>>>>> Stashed changes
    </View>
  );

  return (
<<<<<<< Updated upstream
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
=======
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🌱</Text>
            <Text style={styles.logoLabel}>Diary Dashboard</Text>
          </View>

          <Text style={styles.description}>
            The Farm Management System helps farm admins manage users, schedule activities, track performance, and analyze financial data, while staff can log activities, view schedules, and request inventory.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGetStarted}
            >
              <Notebook size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={scrollToHelp}
            >
              <HelpCircle size={20} color="#33b76d" />
              <Text style={styles.secondaryButtonText}>Help</Text>
>>>>>>> Stashed changes
            </TouchableOpacity>
          </View>
        </View>

<<<<<<< Updated upstream
        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>User Guide</Text>
          <Text style={styles.guideDesc}>
            This guide provides an overview of system functionalities, installation steps, and user roles.
          </Text>

          <View style={styles.featuresBlock}>
            <Text style={styles.sectionTitle}>Admin Features</Text>
            <Text style={styles.sectionDesc}>
=======
        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.sectionTitle}>User Guide</Text>
          <Text style={styles.sectionDescription}>
            This guide provides an overview of system functionalities, installation steps, and user roles.
          </Text>

          {/* Admin Features */}
          <View style={styles.featureSection}>
            <Text style={styles.subsectionTitle}>Admin Features</Text>
            <Text style={styles.subsectionDescription}>
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
          <View style={styles.featuresBlock}>
            <Text style={styles.sectionTitle}>Staff Features</Text>
            <Text style={styles.sectionDesc}>
=======
          {/* Staff Features */}
          <View style={styles.featureSection}>
            <Text style={styles.subsectionTitle}>Staff Features</Text>
            <Text style={styles.subsectionDescription}>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
=======
  container: {
    flex: 1,
    backgroundColor: '#fff',
>>>>>>> Stashed changes
  },
  scrollContent: {
    padding: 20,
  },
  heroSection: {
    paddingTop: 40,
    paddingBottom: 40,
  },
<<<<<<< Updated upstream
  heroRow: {
=======
  logoContainer: {
>>>>>>> Stashed changes
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
<<<<<<< Updated upstream
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
=======
  logoText: {
    fontSize: 40,
    marginRight: 12,
  },
  logoLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#33b76d',
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
>>>>>>> Stashed changes
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
<<<<<<< Updated upstream
    backgroundColor: Theme.primary,
=======
    backgroundColor: '#33b76d',
>>>>>>> Stashed changes
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
<<<<<<< Updated upstream
  getStartedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpBtn: {
=======
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
>>>>>>> Stashed changes
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
<<<<<<< Updated upstream
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: Theme.primary,
=======
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#33b76d',
>>>>>>> Stashed changes
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
<<<<<<< Updated upstream
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
=======
  secondaryButtonText: {
    color: '#33b76d',
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 32,
  },
  featureSection: {
    marginBottom: 32,
  },
  subsectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#33b76d',
  },
  subsectionDescription: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featureIcon: {
    fontSize: 32,
>>>>>>> Stashed changes
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
<<<<<<< Updated upstream
    color: Theme.primary,
  },
  featureDesc: {
    fontSize: 14,
    color: Theme.gray500,
    lineHeight: 20,
  },
});
=======
    color: '#33b76d',
  },
  featureDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});
>>>>>>> Stashed changes
