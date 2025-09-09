import React from 'react';
import { render } from '@testing-library/react-native';
import TabTwoScreen from '../GambleApp/app/(tabs)/explore';

it('renders the app root without crashing', () => {
  const tree = render(<TabTwoScreen />);
  expect(tree.toJSON()).toBeTruthy();
});