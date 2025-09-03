import React, { useState, useEffect, useContext } from 'react';
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
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../context/ThemeContext';
import { globalStyles } from '../../../globalStyles';
export default function EditCollectionModal({
  visible,
  onClose,
  onSave,
  initialName,
}) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
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
            <KeyboardAvoidingView behavior="padding">
              <View style={[styles.container, { backgroundColor: theme.cardCollectionBackground }]}>
                <Text style={[globalStyles.subheading, styles.title, { color: theme.text }]}>
                  {t('collections.edit')}
                </Text>

                <TextInput
                  placeholder={t('collections.enterNewName')}
                  placeholderTextColor={theme.placeholder}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (showError && text.trim()) setShowError(false);
                  }}
                  style={[
                    globalStyles.body,
                    styles.input,
                    {
                      color: theme.inputText,
                      backgroundColor: theme.background,
                      borderColor: showError ? '#EF4444' : theme.border,
                    },
                  ]}
                />

                {showError && (
                  <Text style={[globalStyles.smallText, styles.errorText]}>
                                          {t('collections.nameRequired')}
                  </Text>
                )}

                <View style={styles.buttons}>
                  <TouchableOpacity onPress={onClose} style={styles.btnSecondary}>
                    <Text style={[globalStyles.body, { color: theme.mutedText }]}>
                                              {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.btnPrimary}>
                    <Text style={[globalStyles.body, styles.btnPrimaryText]}>
                                              {t('collections.done')}
                    </Text>
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
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
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