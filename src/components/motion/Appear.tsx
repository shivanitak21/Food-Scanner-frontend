import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useReduceMotion } from '@/hooks/useReduceMotion';

export function Appear({ index = 0, children }: { index?: number; children: ReactNode }) {
  const reduceMotion = useReduceMotion();
  if (reduceMotion) return <View>{children}</View>;
  return <Animated.View entering={FadeInUp.duration(420).delay(Math.min(index, 8) * 55)}>{children}</Animated.View>;
}
