import { View, Image, Text, StyleSheet } from 'react-native';
import { typeIcons } from '../../constants';

export default function LabelWithIcon({ types, text }) {
  return (
    <View style={styles.iconRow}>
      {types?.map((type, i) => {
        const iconSource = typeIcons[type];
        return iconSource ? (
          <Image
            key={i}
            source={iconSource}
            style={styles.iconImage}
            resizeMode="contain"
          />
        ) : null;
      })}
      <Text style={styles.labelText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconImage: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  labelText: {
    color: '#444',
    fontSize: 15,
    fontWeight: '500',
  },
});
