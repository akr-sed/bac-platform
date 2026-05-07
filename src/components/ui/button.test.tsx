import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Button, buttonVariants } from './button';

afterEach(() => { cleanup(); });

describe('Button (Wave 2)', () => {
  it('renders with primary-blue intent by default', () => {
    const { container } = render(<Button>Click me</Button>);
    const btn = container.querySelector('[data-slot="button"]');
    expect(btn).toBeTruthy();
    expect(btn?.className).toContain('bg-[#0095D1]');
  });

  it('renders primary-red intent', () => {
    const { container } = render(<Button intent="primary-red">Red</Button>);
    const btn = container.querySelector('[data-slot="button"]');
    expect(btn?.className).toContain('bg-[#ED2D30]');
  });

  it('renders secondary-blue intent', () => {
    const { container } = render(<Button intent="secondary-blue">Blue</Button>);
    const btn = container.querySelector('[data-slot="button"]');
    expect(btn?.className).toContain('border-[#0095D1]');
  });

  it('back-compat: variant="outline" applies outline styles', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const btn = container.querySelector('[data-slot="button"]');
    expect(btn?.className).toContain('border-[#0095D1]');
  });

  it('back-compat: variant="ghost" applies ghost styles', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    const btn = container.querySelector('[data-slot="button"]');
    expect(btn?.className).toContain('bg-transparent');
  });

  it('back-compat: variant="destructive" applies destructive styles', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const btn = container.querySelector('[data-slot="button"]');
    expect(btn?.className).toContain('bg-[#ED2D30]');
  });

  it('renders mobile size', () => {
    const { container } = render(<Button size="mobile">Mobile</Button>);
    const btn = container.querySelector('[data-slot="button"]');
    expect(btn?.className).toContain('rounded-[9.6px]');
  });

  it('renders back-compat icon size', () => {
    const { container } = render(<Button size="icon">Icon</Button>);
    const btn = container.querySelector('[data-slot="button"]');
    expect(btn?.className).toContain('size-10');
  });

  it('loading state shows spinner and disables', () => {
    const { container } = render(<Button loading>Loading</Button>);
    const btn = container.querySelector('[data-slot="button"]') as HTMLButtonElement;
    expect(btn?.disabled).toBe(true);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('fullWidth adds w-full', () => {
    const { container } = render(<Button fullWidth>Full</Button>);
    const btn = container.querySelector('[data-slot="button"]');
    expect(btn?.className).toContain('w-full');
  });

  it('buttonVariants({ variant: "ghost" }) produces ghost classes (back-compat call-sites)', () => {
    const cls = buttonVariants({ variant: 'ghost' });
    expect(cls).toContain('bg-transparent');
  });

  it('buttonVariants({ variant: "outline", size: "sm" }) produces outline+sm classes', () => {
    const cls = buttonVariants({ variant: 'outline', size: 'sm' });
    expect(cls).toContain('border-[#0095D1]');
    expect(cls).toContain('rounded-[12px]');
  });
});
