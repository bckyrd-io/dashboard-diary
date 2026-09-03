import React from 'react';
<<<<<<< Updated upstream
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
=======
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertCircle, Info } from 'lucide-react-native';

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`bg-white rounded-lg p-4 border border-gray-200 ${className}`}>
      {children}
    </View>
  );
>>>>>>> Stashed changes
}

// ── Button ───────────────────────────────────────────────────────────────────
type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost';

export function Button({
  children,
  onPress,
  variant = 'default',
  loading = false,
  disabled = false,
<<<<<<< Updated upstream
  style,
=======
  className = '',
>>>>>>> Stashed changes
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
<<<<<<< Updated upstream
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
=======
  className?: string;
}) {
  const variantClasses: Record<ButtonVariant, string> = {
    default: 'bg-primary',
    outline: 'bg-white border border-gray-300',
    destructive: 'bg-red-500',
    ghost: 'bg-transparent',
  };

  const textClasses: Record<ButtonVariant, string> = {
    default: 'text-white font-semibold',
    outline: 'text-gray-900 font-semibold',
    destructive: 'text-white font-semibold',
    ghost: 'text-gray-700 font-semibold',
  };
>>>>>>> Stashed changes

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
<<<<<<< Updated upstream
      style={[s.btnBase, variantStyle, disabled && s.btnDisabled, style]}
    >
      {loading && <ActivityIndicator color={variant === 'outline' ? Theme.primary : '#fff'} size="small" />}
      {typeof children === 'string' ? <Text style={textStyle}>{children}</Text> : children}
=======
      className={`py-2.5 px-4 rounded-md items-center justify-center flex-row gap-2 ${variantClasses[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading && <ActivityIndicator color={variant === 'outline' ? '#33b76d' : '#fff'} size="small" />}
      {typeof children === 'string' ? (
        <Text className={textClasses[variant]}>{children}</Text>
      ) : (
        children
      )}
>>>>>>> Stashed changes
    </TouchableOpacity>
  );
}

// ── Input ────────────────────────────────────────────────────────────────────
<<<<<<< Updated upstream
export function Input({ style: propStyle, ...props }: TextInputProps & { style?: any }) {
  return <TextInput style={[s.input, propStyle]} placeholderTextColor={Theme.gray500} {...props} />;
=======
import { TextInput, TextInputProps } from 'react-native';

export function Input({
  className = '',
  ...props
}: TextInputProps & { className?: string }) {
  return (
    <TextInput
      className={`border border-gray-300 rounded-md px-3 py-2.5 text-gray-900 bg-white text-base ${className}`}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  );
>>>>>>> Stashed changes
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'outline' | 'success' | 'warning' | 'destructive';

<<<<<<< Updated upstream
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
=======
export function Badge({
  label,
  variant = 'default',
}: {
  label: string;
  variant?: BadgeVariant;
}) {
  const variants: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: 'bg-primary', text: 'text-white' },
    outline: { bg: 'bg-white border border-gray-300', text: 'text-gray-700' },
    success: { bg: 'bg-green-100', text: 'text-green-700' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    destructive: { bg: 'bg-red-100', text: 'text-red-600' },
  };

  const { bg, text } = variants[variant];

  return (
    <View className={`px-3 py-1 rounded-full self-start ${bg}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
>>>>>>> Stashed changes
    </View>
  );
}

<<<<<<< Updated upstream
// ── Status Badge ──────────────────────────────────────────────────────────────
=======
// ── Status Badge (smart color for activity statuses) ──────────────────────────
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
// ── ScreenHeader ──────────────────────────────────────────────────────────────
=======
>>>>>>> Stashed changes
export function ScreenHeader({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
<<<<<<< Updated upstream
    <View style={s.header}>
      <View style={s.headerText}>
        <Text style={s.headerTitle}>{title}</Text>
        {description ? <Text style={s.headerDesc}>{description}</Text> : null}
=======
    <View className="px-4 pt-5 pb-4 flex-row items-start justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-2xl font-bold text-gray-950">{title}</Text>
        {description ? <Text className="text-sm text-gray-500 mt-1">{description}</Text> : null}
>>>>>>> Stashed changes
      </View>
      {action}
    </View>
  );
}

<<<<<<< Updated upstream
// ── EmptyState ────────────────────────────────────────────────────────────────
=======
>>>>>>> Stashed changes
export function EmptyState({ icon: Icon = Info, message }: {
  icon?: typeof Info;
  message: string;
}) {
  return (
<<<<<<< Updated upstream
    <View style={s.emptyWrap}>
      <Icon size={28} color={Theme.gray400} />
      <Text style={s.emptyText}>{message}</Text>
=======
    <View className="items-center py-16 px-6">
      <Icon size={28} color="#9ca3af" />
      <Text className="text-gray-500 mt-3 text-center">{message}</Text>
>>>>>>> Stashed changes
    </View>
  );
}

<<<<<<< Updated upstream
// ── ErrorState ────────────────────────────────────────────────────────────────
export function ErrorState({ message }: { message: string }) {
  return (
    <View style={s.errorWrap}>
      <AlertCircle size={18} color={Theme.error} />
      <Text style={s.errorText}>{message}</Text>
=======
export function ErrorState({ message }: { message: string }) {
  return (
    <View className="mx-4 p-3 rounded-md border border-red-200 bg-red-50 flex-row items-center">
      <AlertCircle size={18} color="#dc2626" />
      <Text className="text-red-700 text-sm ml-2 flex-1">{message}</Text>
>>>>>>> Stashed changes
    </View>
  );
}
