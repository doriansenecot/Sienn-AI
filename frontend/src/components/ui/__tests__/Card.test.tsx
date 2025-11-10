import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders children correctly', () => {
      render(<Card>Test Content</Card>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies default variant class', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.firstChild).toHaveClass('card-body');
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom">Content</Card>);
      expect(container.firstChild).toHaveClass('custom');
    });

    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Card onClick={handleClick}>Clickable</Card>);
      
      fireEvent.click(screen.getByText('Clickable'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies hoverable class when hoverable is true', () => {
      const { container } = render(<Card hoverable>Hover me</Card>);
      expect(container.firstChild).toHaveClass('card-hover');
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });

    it('applies cursor-pointer when onClick is provided', () => {
      const { container } = render(<Card onClick={() => {}}>Click</Card>);
      expect(container.firstChild).toHaveClass('cursor-pointer');
    });
  });

  describe('CardHeader', () => {
    it('renders children correctly', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies card-header class', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      expect(container.firstChild).toHaveClass('card-header');
    });

    it('applies custom className', () => {
      const { container } = render(<CardHeader className="custom">Header</CardHeader>);
      expect(container.firstChild).toHaveClass('custom');
    });
  });

  describe('CardTitle', () => {
    it('renders children correctly', () => {
      render(<CardTitle>Title Text</CardTitle>);
      expect(screen.getByText('Title Text')).toBeInTheDocument();
    });

    it('renders as h3 element', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title.tagName).toBe('H3');
    });

    it('applies default styling classes', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-2xl', 'font-bold', 'text-white');
    });

    it('applies custom className', () => {
      render(<CardTitle className="custom">Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom');
    });
  });

  describe('CardContent', () => {
    it('renders children correctly', () => {
      render(<CardContent>Content Text</CardContent>);
      expect(screen.getByText('Content Text')).toBeInTheDocument();
    });

    it('applies space-y-4 class', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      expect(container.firstChild).toHaveClass('space-y-4');
    });

    it('applies custom className', () => {
      const { container } = render(<CardContent className="custom">Content</CardContent>);
      expect(container.firstChild).toHaveClass('custom');
    });
  });

  describe('Card composition', () => {
    it('renders all components together', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
          </CardHeader>
          <CardContent>Test Content</CardContent>
        </Card>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });
});
