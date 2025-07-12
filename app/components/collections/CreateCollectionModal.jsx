import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { getDBConnection, createCollection } from '../../lib/db';

export default function CreateCollectionModal({ visible, onClose, onCreated }) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError(true);
      return;
    }
    const db = await getDBConnection();
    await createCollection(db, newName.trim());
    setNewName('');
    setError(false);
    onClose();
    if (onCreated) onCreated();
  };

  const handleBackdropPress = () => {
    Keyboard.dismiss();
    setError(false);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              <Text style={styles.title}>New Collection</Text>

              <TextInput
                placeholder="Enter collection name"
                placeholderTextColor="#94A3B8"
                value={newName}
                onChangeText={(text) => {
                  setNewName(text);
                  if (error && text.trim()) setError(false);
                }}
                style={[
                  styles.input,
                  error && styles.inputError,
                ]}
              />
              {error && (
                <Text style={styles.errorText}>Collection name is required.</Text>
              )}

              <View style={styles.buttons}>
                <TouchableOpacity onPress={onClose} style={styles.btnSecondary}>
                  <Text style={styles.btnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreate} style={styles.btnPrimary}>
                  <Text style={styles.btnPrimaryText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    elevation: 10,
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