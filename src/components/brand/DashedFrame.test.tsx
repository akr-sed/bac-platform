import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DashedFrame } from './DashedFrame';
import { DashedDivider } from './DashedDivider';

afterEach(cleanup);

describe('DashedFrame', () => {
  it('renders children inside a dashed border', () => {
    render(<DashedFrame>Hello</DashedFrame>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('uses navy intent class when intent="navy"', () => {
    const { container } = render(<DashedFrame intent="navy">x</DashedFrame>);
    expect(container.firstChild).toHaveClass('border-[--foreground-deep,#003449]');
  });
});

describe('DashedDivider', () => {
  it('renders a horizontal separator by default', () => {
    render(<DashedDivider />);
    const sep = screen.getByRole('separator');
    expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('renders a vertical separator when direction="vertical"', () => {
    render(<DashedDivider direction="vertical" />);
    const sep = screen.getByRole('separator');
    expect(sep).toHaveAttribute('aria-orientation', 'vertical');
  });
});
