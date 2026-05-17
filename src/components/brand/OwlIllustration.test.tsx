// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { OwlIllustration } from './OwlIllustration';

afterEach(cleanup);

describe('OwlIllustration', () => {
  it('renders an inline SVG for any variant', () => {
    const { container } = render(<OwlIllustration variant="empty-feed" />);
    const wrapper = screen.getByRole('img', { name: /empty-feed/ });
    expect(wrapper).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies CSS variable tint for success variant', () => {
    render(<OwlIllustration variant="success" />);
    const wrapper = screen.getByRole('img', { name: /success/ });
    expect(wrapper).toHaveStyle({ '--owl-beak': '#00B22A' });
  });

  it('applies CSS variable tint for loading variant', () => {
    render(<OwlIllustration variant="loading" />);
    const wrapper = screen.getByRole('img', { name: /loading/ });
    expect(wrapper).toHaveStyle({ '--owl-beak': '#0095D1' });
    expect(wrapper).toHaveStyle({ '--owl-eye-iris': '#0095D1' });
  });

  it('respects size prop on the inline SVG', () => {
    const { container } = render(<OwlIllustration variant="empty-feed" size={200} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('height', '200');
    expect(svg).toHaveAttribute('width', '200');
  });

  it('does NOT apply animation classes when animate is false / undefined', () => {
    const { container } = render(<OwlIllustration variant="empty-feed" />);
    expect(container.querySelector('.owl-anim-body')).toBeNull();
    expect(container.querySelector('.owl-anim-eyes')).toBeNull();
  });

  it('applies animation classes when animate={true}', () => {
    const { container } = render(<OwlIllustration variant="loading" animate />);
    expect(container.querySelector('.owl-anim-body')).toBeInTheDocument();
    expect(container.querySelector('.owl-anim-eyes')).toBeInTheDocument();
  });
});
