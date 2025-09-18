import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from './app/(auth)/register';
import { SQLiteProvider } from 'expo-sqlite';


test('renders the app root without crashing', () => {
  render(
    <SQLiteProvider databaseName="test.db">
      <HomeScreen />
    </SQLiteProvider>
  );
});