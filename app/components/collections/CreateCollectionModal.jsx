import React, { useState, useContext } from 'react';
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
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';

export default function CreateCollectionModal({ visible, onClose, onCreated }) {
  const { theme } = useContext(ThemeContext);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState(false);

  const styles = getStyles(theme, error);

const handleCreate = async () => {
  if (!newName.trim()) {
    setError(true);
    return;
  }

  try {
    const db = await getDBConnection();
    await createCollection(db, newName.trim());
    setNewName('');
    setError(false);
    onClose();
    if (onCreated) onCreated();
  } catch (_) {
    // Silently ignore any errors
  }
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
              <Text style={[globalStyles.subheading, styles.title]}>
                New Collection
              </Text>

              <TextInput
                placeholder="Enter collection name"
                placeholderTextColor={theme.placeholder}
                value={newName}
                onChangeText={(text) => {
                  setNewName(text);
                  if (error && text.trim()) setError(false);
                }}
                style={[globalStyles.body, styles.input]}
              />
              {error && (
                <Text style={[globalStyles.smallText, styles.errorText]}>
                  Collection name is required.
                </Text>
              )}

              <View style={styles.buttons}>
                <TouchableOpacity onPress={onClose} style={styles.btnSecondary}>
                  <Text style={[globalStyles.body, styles.btnSecondaryText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreate} style={styles.btnPrimary}>
                  <Text style={[globalStyles.body, styles.btnPrimaryText]}>
                    Create
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const getStyles = (theme, error) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      padding: 24,
    },
    container: {
      borderRadius: 16,
      padding: 20,
      backgroundColor: theme.cardCollectionBackground,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
      elevation: 10,
    },
    title: {
      textAlign: 'center',
      marginBottom: 16,
      color: theme.text,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: theme.background,
      color: theme.inputText,
      borderColor: error ? '#EF4444' : theme.border,
    },
    errorText: {
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
      color: theme.mutedText,
    },
    btnPrimary: {
      backgroundColor: '#10B981',
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    btnPrimaryText: {
      color: '#FFFFFF',
    },
  });