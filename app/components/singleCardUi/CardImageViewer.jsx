import React, { useState, useContext } from 'react';
import { TouchableOpacity, StyleSheet, Image } from 'react-native';
import AnimatedSection from './AnimatedSection';
import FullImageModal from './FullImageModal';
import { ThemeContext } from '../../context/ThemeContext';
export default function CardImageViewer({ imageSource }) {
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useContext(ThemeContext);

  const openImageModal = () => {
    setModalVisible(true);
  };

  return (
    <>
      <AnimatedSection style={[styles.container, { backgroundColor: theme.inputBackground }]}>
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