import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock para next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: { src: string; alt: string; fill?: boolean; className?: string }) => {
    return { type: 'img', props };
  },
}));

// Mock para next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: unknown; href: string }) => ({
    type: 'a',
    props: { href },
    children,
  }),
}));

// Mock para next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock para radix-ui (evitar errores de imports)
vi.mock('@radix-ui/react-dialog', () => ({
  Dialog: ({ children }: { children: unknown }) => children,
  DialogTrigger: ({ children }: { children: unknown }) => children,
  DialogContent: ({ children }: { children: unknown }) => children,
}));

vi.mock('@radix-ui/react-select', () => ({
  Select: ({ children }: { children: unknown }) => children,
  SelectTrigger: ({ children }: { children: unknown }) => children,
  SelectContent: ({ children }: { children: unknown }) => children,
  SelectItem: ({ children }: { children: unknown }) => children,
  SelectValue: () => null,
}));

// Mock para date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date) => '2024-04-15'),
  addDays: vi.fn((date: Date, days: number) => new Date(date.getTime() + days * 86400000)),
  startOfMonth: vi.fn((date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)),
  endOfMonth: vi.fn((date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  eachDayOfInterval: vi.fn(() => []),
  isSameDay: vi.fn(() => false),
  isSameMonth: vi.fn(() => true),
  startOfWeek: vi.fn((date: Date) => date),
  endOfWeek: vi.fn((date: Date) => date),
  addMonths: vi.fn((date: Date) => date),
  subMonths: vi.fn((date: Date) => date),
}));

// Limpiar mocks después de cada test
afterEach(() => {
  vi.clearAllMocks();
});
