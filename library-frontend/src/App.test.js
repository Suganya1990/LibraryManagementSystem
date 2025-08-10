import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard heading', () => {
  render(<App />);
  const headerElement = screen.getByText(/Library Management System/i);
  expect(headerElement).toBeInTheDocument();
});

test('shows account and history links for user role', () => {
  render(<App />);
  expect(screen.getAllByText(/Account/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/History/i).length).toBeGreaterThan(0);
});
