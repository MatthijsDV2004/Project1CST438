import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../GambleApp/app/(tabs)/index';
import { SQLiteProvider } from 'expo-sqlite';


test('renders the app root without crashing', () => {
  render(
    <SQLiteProvider databaseName="test.db">
      <HomeScreen />
    </SQLiteProvider>
  );
});