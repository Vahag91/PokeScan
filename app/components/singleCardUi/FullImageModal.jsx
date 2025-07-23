import React, { useContext } from 'react';
import {
  Modal,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  View,
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
          { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.9)' },
        ]}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={closeImageModal}
        >
          <FasterImageView
            source={{ uri: cardImage }}
            style={styles.fullImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                backgroundColor:
                  theme === 'dark'
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(255,255,255,0.3)',
              },
            ]}
            onPress={closeImageModal}
          >
            <Ionicons
              name="close-sharp"
              size={30}
              color={theme === 'dark' ? '#fff' : '#fff'}
            />
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
});