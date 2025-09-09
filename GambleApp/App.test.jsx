import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../GambleApp/App';

it('renders the app root without crashing', () => {
  const tree = render(<App />);
  expect(tree.toJSON()).toBeTruthy();
});w