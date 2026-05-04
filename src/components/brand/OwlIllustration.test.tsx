// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { OwlIllustration } from './OwlIllustration';

afterEach(cleanup);

describe('OwlIllustration', () => {
  it('renders the base SVG for any variant', () => {
    render(<OwlIllustration variant="empty-feed" />);
    const wrapper = screen.getByRole('img', { name: /empty-feed/ });
    expect(wrapper).toBeInTheDocument();
  });

  it('applies CSS variable tint for success variant', () => {
    render(<OwlIllustration variant="success" />);
    const wrapper = screen.getByRole('img', { name: /success/ });
    expect(wrapper).toHaveStyle({ '--owl-beak': '#00B22A' });
  });

  it('respects size prop', () => {
    const { container } = render(<OwlIllustration variant="empty-feed" size={200} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('height', '200');
  });
});
