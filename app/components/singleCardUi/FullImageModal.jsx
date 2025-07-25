import React, { useContext } from 'react';
import {
  Modal,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  View,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FasterImageView } from '@rraut/react-native-faster-image';
import { ThemeContext } from '../../context/ThemeContext';

export default function FullImageModal({
  cardImage,
  modalVisible,
  setModalVisible,
}) {
  const { theme } = useContext(ThemeContext);

  const closeImageModal = () => {
    setModalVisible(false);
  };

  const isLocalFile = cardImage?.startsWith('file://');
  const isDark = theme === 'dark';

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeImageModal}
    >
      <View
        style={[
          styles.modalBackdrop,
          isDark ? styles.backdropDark : styles.backdropLight,
        ]}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={closeImageModal}
        >
          {isLocalFile ? (
            <Image
              source={{ uri: cardImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : (
            <FasterImageView
              source={{ uri: cardImage, resizeMode: 'contain' }}
              style={styles.fullImage}
            />
          )}

          <TouchableOpacity
            style={[
              styles.closeButton,
              isDark ? styles.closeButtonDark : styles.closeButtonLight,
            ]}
            onPress={closeImageModal}
          >
            <Ionicons name="close-sharp" size={30} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropDark: {
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  backdropLight: {
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalContainer: {
    width: '100%',
    height: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '97%',
    height: '80%',
    borderRadius: 12,
  },
  closeButton: {
    position: 'absolute',
    bottom: StatusBar.currentHeight + 45,
    padding: 8,
    borderRadius: 20,
  },
  closeButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  closeButtonLight: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});