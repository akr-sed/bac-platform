import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { EmptyState } from './EmptyState';

afterEach(() => { cleanup(); });

// Mock next/image used inside OwlIllustration
vi.mock('next/image', () => ({
  default: ({ alt, src, width, height }: { alt: string; src: string; width: number; height: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} width={width} height={height} />
  ),
}));

describe('EmptyState (Wave 2)', () => {
  it('renders title and owl illustration', () => {
    render(<EmptyState variant="empty-feed" title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByRole('img')).toBeTruthy();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        variant="empty-search"
        title="No results"
        description="Try adjusting your filters"
      />
    );
    expect(screen.getByText('Try adjusting your filters')).toBeTruthy();
  });

  it('renders action button with onClick', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        variant="empty-saved"
        title="No saved"
        action={{ label: 'Browse', onClick: handleClick }}
      />
    );
    const btn = screen.getByRole('button', { name: /Browse/i });
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders action as anchor when href is provided', () => {
    render(
      <EmptyState
        variant="success"
        title="Done!"
        action={{ label: 'Go home', href: '/ar' }}
      />
    );
    const anchor = screen.getByRole('link', { name: /Go home/i });
    expect(anchor).toBeTruthy();
  });

  it('does not render description if not provided', () => {
    render(<EmptyState variant="empty-error" title="Error" />);
    expect(screen.queryByRole('paragraph')).toBeNull();
  });
});
