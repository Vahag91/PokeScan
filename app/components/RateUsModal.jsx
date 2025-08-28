import React, { useState, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RateUsService from '../services/RateUsService';
import { ThemeContext } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const RateUsModal = ({ visible, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const { theme } = useContext(ThemeContext);

  const handleRateNow = async () => {
    try {
      setSubmitted(true);
      await RateUsService.showRatePrompt();
      onClose();
    } catch (error) {
      onClose();
    }
  };

  const handleMaybeLater = async () => {
    try {
      // Mark that we showed the prompt today
      await RateUsService.markPromptShown();
      onClose();
    } catch (error) {
      onClose();
    }
  };

  const handleDontAskAgain = async () => {
    try {
      await RateUsService.setDontAskAgain();
      onClose();
    } catch (error) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlayDarker }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.cardCollectionBackground }]}>
          <View style={styles.header}>
            <Ionicons name="star" size={35} color="#FFD700" />
            <Text style={[styles.title, { color: theme.text }]}>Rate Our App</Text>
            <Text style={[styles.subtitle, { color: theme.mutedText }]}>
              Enjoying Pokémon Card Scanner?{'\n'}Your feedback helps us improve!
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleRateNow}
              disabled={submitted}
            >
              <Text style={styles.primaryButtonText}>
                {submitted ? 'Opening...' : 'Rate Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { backgroundColor: theme.buttonBackground, borderColor: theme.buttonBorder }]}
              onPress={handleMaybeLater}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Maybe Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dontAskButton}
              onPress={handleDontAskAgain}
            >
              <Text style={[styles.dontAskText, { color: theme.mutedText }]}>Don't Ask Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 15,
    padding: 15,
    margin: 20,
    width: width - 40,
    maxWidth: 310,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 7,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dontAskButton: {
    paddingVertical: 3,
    alignItems: 'center',
  },
  dontAskText: {
    fontSize: 12,
  },
});

export default RateUsModal;
