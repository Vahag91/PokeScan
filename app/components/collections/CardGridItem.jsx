import React, { useEffect, useRef, useContext } from 'react';
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  UIManager,
  Animated,
  Appearance,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFullPath } from '../../utils';
import { BlurView } from '@react-native-community/blur';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CardGridItem({
  item,
  isSelected,
  onLongPress,
  onPress,
  onDecrease,
  onIncrease,
  onDelete,
  onClose,
}) {
  const { theme } = useContext(ThemeContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const closeAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(closeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(closeAnim, {
          toValue: 20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.cardCollectionBackground }]}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
        activeOpacity={0.95}
      >
        <Image
          source={{ uri: getFullPath(item.imagePath) }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <Text
          style={[globalStyles.smallText, styles.cardName, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.customName || item.name}
        </Text>

        {item.quantity > 1 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>×{item.quantity}</Text>
          </View>
        )}
      </TouchableOpacity>

      {isSelected && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'}
            blurAmount={18}
            reducedTransparencyFallbackColor={theme.inputBackground}
          />

          <Animated.View
            style={[
              styles.editorContainer,
              {
                backgroundColor: `${theme.inputBackground}CC`,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Animated.View
              style={[styles.closeButton, { transform: [{ translateY: closeAnim }] }]}
            >
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={20} color="#16A34A" />
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={onDecrease} style={styles.editButton}>
              <Ionicons name="remove" size={22} color="#DC2626" />
            </TouchableOpacity>

            <Text style={[globalStyles.body, styles.editQty, { color: theme.text }]}>
              {item.quantity}
            </Text>

            <TouchableOpacity onPress={onIncrease} style={styles.editButton}>
              <Ionicons name="add" size={22} color="#16A34A" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
              <Ionicons name="trash" size={18} color={theme.secondaryText} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '49%',
    marginBottom: 6,
  },
  card: {
    borderRadius: 16,
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
  },
  cardName: {
    textAlign: 'center',
  },
  quantityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorContainer: {
    width: '95%',
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
    position: 'relative',
  },
  editButton: {
    padding: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 10,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  editQty: {
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    top: -40,
    left: '50%',
    transform: [{ translateX: -15 }],
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    padding: 6,
    elevation: 5,
    zIndex: 20,
  },
});