import { Platform, StyleSheet } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Tabs } from 'expo-router';

const FORGE_BLACK = '#0d0d12';
const FORGE_BORDER = '#2a2a35';
const FORGE_MUTED = '#5c5c72';
const FORGE_ACCENT = '#ff6b35';
const FORGE_TEXT = '#f5f5f7';

type TabIconProps = {
  name: SymbolViewProps['name'];
  nameFocused?: SymbolViewProps['name'];
  color: string;
  focused: boolean;
};

function TabIcon({ name, nameFocused, color, focused }: TabIconProps) {
  return (
    <SymbolView
      name={focused && nameFocused ? nameFocused : name}
      tintColor={color}
      size={22}
      weight={focused ? 'semibold' : 'regular'}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: FORGE_BLACK },
        headerTintColor: FORGE_TEXT,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        tabBarActiveTintColor: FORGE_ACCENT,
        tabBarInactiveTintColor: FORGE_MUTED,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="house" nameFocused="house.fill" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="dumbbell"
              nameFocused="dumbbell.fill"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="calendar"
              nameFocused="calendar"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="sparkles"
              nameFocused="sparkles"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="chart.line.uptrend.xyaxis"
              nameFocused="chart.line.uptrend.xyaxis"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" nameFocused="person.fill" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: FORGE_BLACK,
    borderTopColor: FORGE_BORDER,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    paddingTop: 6,
    height: Platform.OS === 'ios' ? 88 : 64,
  },
  tabItem: {
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: 2,
  },
});
