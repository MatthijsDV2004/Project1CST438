import React from 'react';
import { render } from '@testing-library/react-native';
import RootLayout from '../GambleApp/app/_layouts';

it('renders the app root without crashing', () => {
  const tree = render(<RootLayout />);
  expect(tree.toJSON()).toBeTruthy();
});