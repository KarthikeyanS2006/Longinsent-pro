import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { theme, spacing, borderRadius } from '../styles/theme';

export default function SearchBar({ 
  placeholder = 'Search exams...', 
  onSearch, 
  onFilterPress,
  filterActive = false 
}) {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.dimText}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {onFilterPress && (
        <TouchableOpacity 
          style={[styles.filterButton, filterActive && styles.filterActive]}
          onPress={onFilterPress}
        >
          <Text style={styles.filterIcon}>☰</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: theme.text,
    fontSize: 16,
    paddingVertical: spacing.md,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearIcon: {
    color: theme.dimText,
    fontSize: 14,
  },
  filterButton: {
    marginLeft: spacing.sm,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterIcon: {
    color: theme.text,
    fontSize: 16,
  },
});

import { StyleSheet } from 'react-native';
