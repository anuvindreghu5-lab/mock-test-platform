import { render, screen } from '@testing-library/react';
import App from './App';

test('renders RankAura splash screen', () => {
  render(<App />);
  expect(screen.getByText(/RankAura/i)).toBeInTheDocument();
  expect(screen.getByText(/exam preparation platform/i)).toBeInTheDocument();
});
