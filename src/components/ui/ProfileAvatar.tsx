import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { avatarFor, type AvatarPerson } from '@/constants/photos';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  person: AvatarPerson;
  size?: number;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ProfileAvatar({ person, size = 48, selected = false, style }: Props) {
  const { colors } = useTheme();
  const ring = selected ? 2.5 : 2;

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ring,
          borderColor: selected ? colors.accent : colors.glassBorder,
          boxShadow: `0 6px 14px ${colors.shadow}`,
        },
        style,
      ]}
    >
      <Image
        source={avatarFor(person)}
        contentFit="cover"
        accessibilityLabel={person.name ? `${person.name} avatar` : 'Profile avatar'}
        style={{ width: size - ring * 2, height: size - ring * 2, borderRadius: size / 2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
