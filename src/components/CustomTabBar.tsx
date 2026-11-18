import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

// Colors from design
const COLORS = {
  primary: '#6B0000',
  secondary: '#850404',
  ivory: '#FAF6F0',
  gold: '#D5A63A',
  champagne: '#EBD197', // Champage gold for inactive
  activeText: '#FFF9ED', // Warm white
  darkText: '#1A1111'
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Custom height excluding safe area
  const BAR_HEIGHT = 75;
  const TOTAL_HEIGHT = BAR_HEIGHT + insets.bottom;

  // Filter out hidden routes (orders, products, or anything with href: null)
  const visibleRoutes = state.routes.filter(route => {
    const { options } = descriptors[route.key];
    return (options as any).href !== null && route.name !== 'orders';
  });

  const tabWidth = width / (visibleRoutes.length || 1);

  // Animated value for the sliding circle and curve (0 to N-1)
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Active index mapped to the filtered routes
  const activeRoute = state.routes[state.index];
  const activeIndex = visibleRoutes.findIndex(r => r.key === activeRoute.key);

  useEffect(() => {
    if (activeIndex >= 0) {
      Animated.spring(slideAnim, {
        toValue: activeIndex,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }).start();
    }
  }, [activeIndex]);

  // SVG background sliding logic
  const svgWidth = width * 3;
  const svgCenter = svgWidth / 2;
  const curveWidth = 110;
  const curveDepth = 45;

  const d = `
    M 0 0
    L ${svgCenter - curveWidth / 2} 0
    C ${svgCenter - curveWidth / 3.5} 0,
      ${svgCenter - curveWidth / 4} ${curveDepth},
      ${svgCenter} ${curveDepth}
    C ${svgCenter + curveWidth / 4} ${curveDepth},
      ${svgCenter + curveWidth / 3.5} 0,
      ${svgCenter + curveWidth / 2} 0
    L ${svgWidth} 0
    L ${svgWidth} ${TOTAL_HEIGHT}
    L 0 ${TOTAL_HEIGHT}
    Z
  `;

  // Translate to correctly position SVG center on X=0
  const baseTranslate = -svgCenter;

  const inputRange = visibleRoutes.length > 1 ? visibleRoutes.map((_, i) => i) : [0, 1];
  const bgOutputRange = visibleRoutes.length > 1
    ? visibleRoutes.map((_, i) => baseTranslate + tabWidth * (i + 0.5))
    : [baseTranslate + tabWidth / 2, baseTranslate + tabWidth * 1.5];
  const circleOutputRange = visibleRoutes.length > 1
    ? visibleRoutes.map((_, i) => tabWidth * (i + 0.5) - 32)
    : [tabWidth / 2 - 32, tabWidth * 1.5 - 32];

  const bgTranslateX = slideAnim.interpolate({
    inputRange,
    outputRange: bgOutputRange,
  });

  const circleTranslateX = slideAnim.interpolate({
    inputRange,
    outputRange: circleOutputRange,
  });

  return (
    <View style={[styles.container, { height: TOTAL_HEIGHT }]}>
      {/* 1. Sliding Background Curve */}
      <View style={[StyleSheet.absoluteFill, styles.bgContainer]} pointerEvents="none">
        <AnimatedSvg
          width={svgWidth}
          height={TOTAL_HEIGHT}
          style={{ transform: [{ translateX: bgTranslateX }] }}
        >
          <Path d={d} fill={COLORS.primary} />
          {/* Top Gold Border */}
          <Path
            d={`M 0 0 L ${svgCenter - curveWidth / 2} 0 C ${svgCenter - curveWidth / 3.5} 0, ${svgCenter - curveWidth / 4} ${curveDepth}, ${svgCenter} ${curveDepth} C ${svgCenter + curveWidth / 4} ${curveDepth}, ${svgCenter + curveWidth / 3.5} 0, ${svgCenter + curveWidth / 2} 0 L ${svgWidth} 0`}
            fill="none" stroke={COLORS.gold} strokeWidth="2"
          />
        </AnimatedSvg>
      </View>

      {/* 2. Sliding Raised Circle Bubble (pointerEvents none to never block tab clicks) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.centerButton,
          {
            transform: [{ translateX: circleTranslateX }],
            opacity: activeIndex >= 0 ? 1 : 0,
          },
        ]}
      >
        <View style={styles.centerButtonInner} />
      </Animated.View>

      {/* 3. Icons and Labels */}
      <View style={[styles.tabContent, { height: BAR_HEIGHT }]}>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title !== undefined ? options.title : route.name;
          const isFocused = activeIndex === index;

          const onPress = () => {
            const event = navigation?.emit ? navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            }) : { defaultPrevented: false };

            if (!isFocused && !event?.defaultPrevented) {
              try {
                navigation.dispatch({
                  ...CommonActions.navigate({ name: route.name, merge: true }),
                  target: state.key,
                });
              } catch {
                try {
                  navigation?.navigate?.(route.name);
                } catch {}
              }

              const tabPath = route.name === 'index' ? '/(tabs)' : `/(tabs)/${route.name}`;
              try {
                router.navigate(tabPath as any);
              } catch {
                try {
                  router.replace(tabPath as any);
                } catch {}
              }
            }
          };

          // Determine icon name based on route
          let iconName: any = 'help';
          if (route.name === 'index') iconName = 'home-outline';
          if (route.name === 'categories') iconName = 'grid-outline';
          if (route.name === 'products') iconName = 'pricetags-outline';
          if (route.name === 'daily-update') iconName = 'sparkles-outline';
          if (route.name === 'profile') iconName = 'person-outline';

          return (
            <TabIcon
              key={route.key}
              iconName={iconName}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              isDailyUpdate={route.name === 'daily-update'}
            />
          );
        })}
      </View>
    </View>
  );
}

// Separate component to handle individual icon animations
function TabIcon({ iconName, label, isFocused, onPress, isDailyUpdate }: any) {
  const animatedFocus = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedFocus, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [isFocused]);

  const translateY = animatedFocus.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -34], // Move UP into the circle
  });

  const labelOpacity = animatedFocus.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0], // Hide label when active
  });

  const underlineOpacity = animatedFocus.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1], // Show underline when active
  });

  const activeIconOpacity = animatedFocus;
  const inactiveIconOpacity = animatedFocus.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.tabItem}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
    >
      <Animated.View pointerEvents="none" style={[styles.iconWrapper, { transform: [{ translateY }] }]}>
        {/* Cross-fade icons instead of animating color property */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', opacity: inactiveIconOpacity }}>
          <Ionicons name={iconName} size={24} color={COLORS.champagne} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={{ position: 'absolute', opacity: activeIconOpacity }}>
          <Ionicons name={iconName} size={24} color={COLORS.activeText} />
        </Animated.View>

        {isDailyUpdate && <View pointerEvents="none" style={styles.notificationDot} />}
      </Animated.View>
      <Animated.Text pointerEvents="none" style={[styles.tabLabel, { color: COLORS.champagne, opacity: labelOpacity }]}>{label}</Animated.Text>

      {/* Keep the active text fixed at the bottom with the underline */}
      <Animated.View pointerEvents="none" style={[styles.activeStateContainer, { opacity: underlineOpacity }]}>
        <Text style={[styles.tabLabel, { color: COLORS.activeText, bottom: 12 }]}>{label}</Text>
        <View style={styles.activeUnderline} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  bgContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tabContent: {
    height: 75,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    zIndex: 20,
    elevation: 20,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    zIndex: 25,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    marginBottom: 8, // Push icon slightly up so it's centered before animating
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    position: 'absolute',
    bottom: 12,
  },
  activeStateContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 30,
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 6,
    width: 16,
    height: 2,
    backgroundColor: COLORS.gold,
    borderRadius: 1,
  },
  centerButton: {
    position: 'absolute',
    top: -28,
    left: 0,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  centerButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(213, 166, 58, 0.5)',
    backgroundColor: COLORS.secondary,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
  }
});
