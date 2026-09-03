import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Button as ExpoButton, TextInput as ExpoTextInput, Text as ExpoText, Column, Row } from '@expo/ui';
import { AlertCircle, Info } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost';

export function Button({
  children,
  onPress,
  variant = 'default',
  loading = false,
  disabled = false,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}) {
  const variantStyles: Record<ButtonVariant, any> = {
    default: { backgroundColor: Theme.primary },
    outline: { backgroundColor: Theme.background, borderWidth: 1, borderColor: Theme.border },
    destructive: { backgroundColor: Theme.destructive },
    ghost: { backgroundColor: 'transparent' },
  };

  const textStyles: Record<ButtonVariant, any> = {
    default: { color: '#ffffff', fontWeight: '600' },
    outline: { color: Theme.foreground, fontWeight: '600' },
    destructive: { color: '#ffffff', fontWeight: '600' },
    ghost: { color: Theme.gray700, fontWeight: '600' },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyles[variant],
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          color={variant === 'outline' ? Theme.primary : '#fff'}
          size="small"
          style={{ marginRight: 8 }}
        />
      )}
      {typeof children === 'string' ? (
        <Text style={[styles.buttonText, textStyles[variant]]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
export function Input({
  style,
  ...props
}: any) {
  return (
    <ExpoTextInput
      placeholderTextColor={Theme.mutedForeground}
      style={[styles.input, style]}
      {...props}
    />
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'outline' | 'success' | 'warning' | 'destructive';

export function Badge({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: BadgeVariant;
}) {
  const variants: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: Theme.primary, text: '#ffffff' },
    outline: { bg: Theme.background, text: Theme.gray700 },
    success: { bg: Theme.successLight, text: Theme.success },
    warning: { bg: Theme.warningLight, text: Theme.warning },
    destructive: { bg: Theme.errorLight, text: Theme.destructive },
  };

  const { bg, text } = variants[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
    </View>
  );
}

// ── Status Badge (smart color for activity statuses) ──────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    Completed: 'success',
    'In Progress': 'warning',
    Assigned: 'outline',
    Revenue: 'success',
    Expense: 'destructive',
    Neutral: 'default',
  };
  return <Badge label={status} variant={variantMap[status] ?? 'default'} />;
}

// ── Screen Header ────────────────────────────────────────────────────────────
export function ScreenHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.screenHeader}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.screenTitle}>{title}</Text>
        {description ? (
          <Text style={styles.screenDescription}>{description}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon = Info,
  message,
}: {
  icon?: typeof Info;
  message: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Icon size={28} color={Theme.mutedForeground} />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

// ── Error State ──────────────────────────────────────────────────────────────
export function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.errorState}>
      <AlertCircle size={18} color={Theme.destructive} />
      <Text style={styles.errorStateText}>{message}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
  },
  buttonText: {
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Theme.foreground,
    backgroundColor: Theme.muted,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.gray900,
  },
  screenDescription: {
    fontSize: 13,
    color: Theme.mutedForeground,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    color: Theme.mutedForeground,
    marginTop: 12,
    textAlign: 'center',
  },
  errorState: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorStateText: {
    color: Theme.destructive,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
});
