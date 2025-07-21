import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Image } from 'react-native';
import AnimatedSection from './AnimatedSection';
import FullImageModal from './FullImageModal';

export default function CardImageViewer({ imageSource }) {
  const [modalVisible, setModalVisible] = useState(false);

  const openImageModal = () => {
    setModalVisible(true);
  };

  return (
    <>
      <AnimatedSection style={styles.container}>
        <TouchableOpacity onPress={openImageModal} activeOpacity={0.9}>
          <Image
            source={
              typeof imageSource === 'number'
                ? imageSource
                : { uri: imageSource }
            }
            style={styles.image}
          />
        </TouchableOpacity>
      </AnimatedSection>

      <FullImageModal
        cardImage={imageSource}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 470,
    borderRadius: 12,
  },
});
