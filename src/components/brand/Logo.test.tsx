// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { Logo } from './Logo';

afterEach(() => {
  cleanup();
});

describe('Logo', () => {
  it('renders horizontal variant at md size by default', () => {
    render(<Logo />);
    const img = screen.getByRole('img', { name: 'NAJAH' });
    expect(img).toHaveAttribute('alt', 'NAJAH');
    expect(img.getAttribute('src')).toContain('/brand/logo-horizontal.svg');
  });

  it('switches src for variant prop', () => {
    render(<Logo variant="mark" />);
    const img = screen.getByRole('img', { name: 'NAJAH' });
    expect(img.getAttribute('src')).toContain('/brand/logo-mark.svg');
  });

  it('accepts numeric size', () => {
    render(<Logo size={48} />);
    const img = screen.getByRole('img', { name: 'NAJAH' });
    expect(img).toHaveAttribute('height', '48');
  });
});
