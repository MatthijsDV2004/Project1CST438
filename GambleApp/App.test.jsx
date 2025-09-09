import React from 'react';
import { render } from '@testing-library/react-native';
import TabTwoScreen from '../GambleApp/app/(tabs)/explore';
import { SQLiteProvider } from 'expo-sqlite';


test('renders the app root without crashing', () => {
  render(
    <SQLiteProvider databaseName="test.db">
      <TabTwoScreen />
    </SQLiteProvider>
  );
});