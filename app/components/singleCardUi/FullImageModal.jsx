import { Modal, Animated, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function FullImageModal({
  cardImage,
  modalVisible,
  setModalVisible,
  backdropOpacity,
  imageScale
}) {

  const closeImageModal = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(imageScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setModalVisible(false));
  };
  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeImageModal}
    >
      <Animated.View
        style={[styles.modalBackdrop, { opacity: backdropOpacity }]}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={closeImageModal}
        >
          <Animated.Image
            source={{ uri: cardImage }}
            style={[styles.fullImage, { transform: [{ scale: imageScale }] }]}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeImageModal}
          >
            <Ionicons name="close-sharp" size={30} color="white" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
      modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
    modalContainer: {
      width: "100%",
      height: "90%",
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullImage: {
      width: "97%",
      height: "80%",
      borderRadius: 12,
    },
    closeButton: {
      position: 'absolute',
      bottom: StatusBar.currentHeight + 45,
      backgroundColor: 'rgba(255,255,255,0.3)',
      padding: 8,
      borderRadius: 20,
    },
});
