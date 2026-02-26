import { render, screen, fireEvent } from '@testing-library/react';
import DarkModeToggle from '../Components/DarkModeToggle';

const mockSetTheme = jest.fn();
let mockResolvedTheme = 'light';

jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    resolvedTheme: mockResolvedTheme,
  }),
}));

describe('DarkModeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockResolvedTheme = 'light';
  });

  it('renders dark mode button when in light mode', () => {
    render(<DarkModeToggle />);
    expect(screen.getByRole('button')).toHaveTextContent('Dark mode');
  });

  it('renders light mode button when in dark mode', () => {
    mockResolvedTheme = 'dark';
    render(<DarkModeToggle />);
    expect(screen.getByRole('button')).toHaveTextContent('Light mode');
  });

  it('calls setTheme with dark when clicking in light mode', () => {
    mockResolvedTheme = 'light';
    render(<DarkModeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with light when clicking in dark mode', () => {
    mockResolvedTheme = 'dark';
    render(<DarkModeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('has the correct CSS class', () => {
    render(<DarkModeToggle />);
    expect(screen.getByRole('button')).toHaveClass('footer-link');
  });
});
