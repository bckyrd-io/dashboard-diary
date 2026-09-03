import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { AlertCircle, Info } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';

const s = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  btnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  btnDefault: { backgroundColor: Theme.primary },
  btnOutline: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: Theme.gray300 },
  btnDestructive: { backgroundColor: Theme.destructive },
  btnGhost: { backgroundColor: 'transparent' },
  btnDisabled: { opacity: 0.5 },
  textWhite: { color: '#ffffff', fontWeight: '600' as const },
  textDark: { color: Theme.gray900, fontWeight: '600' as const },
  textGhost: { color: Theme.gray700, fontWeight: '600' as const },
  input: {
    borderWidth: 1,
    borderColor: Theme.gray300,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Theme.gray900,
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
  badgeBase: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  badgeDefault: { backgroundColor: Theme.primary },
  badgeOutline: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: Theme.gray300 },
  badgeSuccess: { backgroundColor: Theme.successLight },
  badgeWarning: { backgroundColor: Theme.warningLight },
  badgeDestructive: { backgroundColor: Theme.errorLight },
  badgeText: { fontSize: 12, fontWeight: '600' as const },
  badgeTextWhite: { color: '#ffffff' },
  badgeTextDark: { color: Theme.gray700 },
  badgeTextSuccess: { color: Theme.success },
  badgeTextWarning: { color: Theme.warning },
  badgeTextDestructive: { color: Theme.error },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: { flex: 1, paddingRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700' as const, color: Theme.gray900 },
  headerDesc: { fontSize: 14, color: Theme.gray500, marginTop: 4 },
  emptyWrap: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  emptyText: { color: Theme.gray500, marginTop: 12, textAlign: 'center' },
  errorWrap: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: Theme.errorLight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: { color: Theme.error, fontSize: 14, marginLeft: 8, flex: 1 },
});

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, style]}>{children}</View>;
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
  const variantStyle = {
    default: s.btnDefault,
    outline: s.btnOutline,
    destructive: s.btnDestructive,
    ghost: s.btnGhost,
  }[variant];

  const textStyle = {
    default: s.textWhite,
    outline: s.textDark,
    destructive: s.textWhite,
    ghost: s.textGhost,
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[s.btnBase, variantStyle, disabled && s.btnDisabled, style]}
    >
      {loading && <ActivityIndicator color={variant === 'outline' ? Theme.primary : '#fff'} size="small" />}
      {typeof children === 'string' ? <Text style={textStyle}>{children}</Text> : children}
    </TouchableOpacity>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
export function Input({ style: propStyle, ...props }: TextInputProps & { style?: any }) {
  return <TextInput style={[s.input, propStyle]} placeholderTextColor={Theme.gray500} {...props} />;
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'outline' | 'success' | 'warning' | 'destructive';

const badgeStyles: Record<BadgeVariant, { bg: any; text: any }> = {
  default: { bg: s.badgeDefault, text: s.badgeTextWhite },
  outline: { bg: s.badgeOutline, text: s.badgeTextDark },
  success: { bg: s.badgeSuccess, text: s.badgeTextSuccess },
  warning: { bg: s.badgeWarning, text: s.badgeTextWarning },
  destructive: { bg: s.badgeDestructive, text: s.badgeTextDestructive },
};

export function Badge({ label, variant = 'default' }: { label: string; variant?: BadgeVariant }) {
  const { bg, text } = badgeStyles[variant];
  return (
    <View style={[s.badgeBase, bg]}>
      <Text style={[s.badgeText, text]}>{label}</Text>
    </View>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
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

// ── ScreenHeader ──────────────────────────────────────────────────────────────
export function ScreenHeader({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.header}>
      <View style={s.headerText}>
        <Text style={s.headerTitle}>{title}</Text>
        {description ? <Text style={s.headerDesc}>{description}</Text> : null}
      </View>
      {action}
    </View>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = Info, message }: {
  icon?: typeof Info;
  message: string;
}) {
  return (
    <View style={s.emptyWrap}>
      <Icon size={28} color={Theme.gray400} />
      <Text style={s.emptyText}>{message}</Text>
    </View>
  );
}

// ── ErrorState ────────────────────────────────────────────────────────────────
export function ErrorState({ message }: { message: string }) {
  return (
    <View style={s.errorWrap}>
      <AlertCircle size={18} color={Theme.error} />
      <Text style={s.errorText}>{message}</Text>
    </View>
  );
}
