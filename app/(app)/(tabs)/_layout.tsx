import { Platform, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FORGE_BLACK = '#0d0d12';
const FORGE_BORDER = '#2a2a35';
const FORGE_MUTED = '#5c5c72';
const FORGE_ACCENT = '#ff6b35';
const FORGE_TEXT = '#f5f5f7';

/** Content height for tab items (icons + label). Safe-area inset is added separately. */
const TAB_BAR_CONTENT_HEIGHT = Platform.OS === 'ios' ? 88 : 56;

type TabIconProps = {
  name: SymbolViewProps['name'];
  nameFocused?: SymbolViewProps['name'];
  androidName: keyof typeof Ionicons.glyphMap;
  androidNameFocused?: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
};

function TabIcon({
  name,
  nameFocused,
  androidName,
  androidNameFocused,
  color,
  focused,
}: TabIconProps) {
  const ionName = focused && androidNameFocused ? androidNameFocused : androidName;

  return (
    <SymbolView
      name={focused && nameFocused ? nameFocused : name}
      tintColor={color}
      size={22}
      weight={focused ? 'semibold' : 'regular'}
      // expo-symbols is iOS-only in this SDK — Android needs a real fallback icon.
      fallback={<Ionicons name={ionName} size={22} color={color} />}
    />
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // iOS: keep the previous fixed 88 height (appearance unchanged).
  // Android: include bottom inset in total height so RN's paddingBottom: insets.bottom
  // does not crush icons/labels under edge-to-edge.
  const tabBarHeight =
    Platform.OS === 'ios' ? TAB_BAR_CONTENT_HEIGHT : TAB_BAR_CONTENT_HEIGHT + insets.bottom;

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
        tabBarStyle: [styles.tabBar, { height: tabBarHeight }],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="house"
              nameFocused="house.fill"
              androidName="home-outline"
              androidNameFocused="home"
              color={color}
              focused={focused}
            />
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
              androidName="barbell-outline"
              androidNameFocused="barbell"
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
              androidName="calendar-outline"
              androidNameFocused="calendar"
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
              androidName="sparkles-outline"
              androidNameFocused="sparkles"
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
              androidName="trending-up-outline"
              androidNameFocused="trending-up"
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
            <TabIcon
              name="person"
              nameFocused="person.fill"
              androidName="person-outline"
              androidNameFocused="person"
              color={color}
              focused={focused}
            />
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
