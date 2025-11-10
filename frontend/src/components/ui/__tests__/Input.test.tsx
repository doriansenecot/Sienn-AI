import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders input field', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Username').tagName).toBe('LABEL');
  });

  it('displays error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays helper text when no error', () => {
    render(<Input helperText="Enter your username" />);
    expect(screen.getByText('Enter your username')).toBeInTheDocument();
  });

  it('does not show helper text when error is present', () => {
    render(<Input error="Error message" helperText="Helper text" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('applies error class when error is present', () => {
    render(<Input error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input-error');
  });

  it('applies fullWidth class', () => {
    const { container } = render(<Input fullWidth />);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('forwards props to input element', () => {
    render(<Input type="email" name="email" disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toBeDisabled();
  });

  it('renders with all props together', () => {
    render(
      <Input
        label="Email"
        placeholder="email@example.com"
        helperText="We'll never share your email"
        fullWidth
      />
    );
    
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });
});
