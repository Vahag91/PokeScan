import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  StyleSheet,
} from 'react-native';

export default function EditCollectionModal({
  visible,
  onClose,
  onSave,
  initialName,
}) {
  const [name, setName] = useState('');
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setName(initialName || '');
    setShowError(false);
  }, [initialName, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }
    onSave(name.trim());
  };

  const handleBackdropPress = () => {
    Keyboard.dismiss();
    setShowError(false);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={'padding'}>
              <View style={styles.container}>
                <Text style={styles.title}>Edit Collection Name</Text>

                <TextInput
                  placeholder="Enter new name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (showError && text.trim()) setShowError(false);
                  }}
                  style={[
                    styles.input,
                    showError && styles.inputError,
                  ]}
                />

                {showError && (
                  <Text style={styles.errorText}>Name cannot be empty.</Text>
                )}

                <View style={styles.buttons}>
                  <TouchableOpacity onPress={onClose} style={styles.btnSecondary}>
                    <Text style={styles.btnSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.btnPrimary}>
                    <Text style={styles.btnPrimaryText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
    marginBottom: 4,
    paddingLeft: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  btnSecondary: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnSecondaryText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});