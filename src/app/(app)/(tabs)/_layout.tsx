import { Tabs } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { View, type ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const TAB_ICONS = {
  clients: { android: 'group', ios: 'person.2', web: 'group' },
  dashboard: { android: 'dashboard', ios: 'chart.bar', web: 'dashboard' },
  estimates: { android: 'description', ios: 'doc.text', web: 'description' },
  invoices: { android: 'credit_card', ios: 'creditcard', web: 'credit_card' },
  more: { android: 'more_horiz', ios: 'ellipsis.circle', web: 'more_horiz' },
} satisfies Record<string, { android: AndroidSymbol; ios: SFSymbol; web: AndroidSymbol }>;

type TabIconName = keyof typeof TAB_ICONS;

function TabIcon({ color, name }: { color: ColorValue; name: TabIconName }) {
  return (
    <SymbolView
      fallback={<View style={{ height: 22, width: 22 }} />}
      name={TAB_ICONS[name]}
      size={22}
      tintColor={color}
    />
  );
}

export default function AppTabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          minHeight: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} name="dashboard" />,
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} name="clients" />,
          title: 'Clients',
        }}
      />
      <Tabs.Screen
        name="estimates"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} name="estimates" />,
          title: 'Estimates',
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} name="invoices" />,
          title: 'Invoices',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          tabBarIcon: ({ color }) => <TabIcon color={color} name="more" />,
          title: 'More',
        }}
      />
    </Tabs>
  );
}
