export const darkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  card: '#334155',
  primary: '#38BDF8',
  secondary: '#818CF8',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  text: '#F8FAFC',
  dimText: '#94A3B8',
  border: '#475569',
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export const lightTheme = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#E2E8F0',
  primary: '#0284C7',
  secondary: '#6366F1',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#D97706',
  text: '#0F172A',
  dimText: '#64748B',
  border: '#CBD5E1',
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};

export const theme = darkTheme;

export const gradients = {
  primary: ['#38BDF8', '#818CF8'],
  success: ['#22C55E', '#10B981'],
  error: ['#EF4444', '#F97316'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
