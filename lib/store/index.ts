/**
 * lib/store/index.ts
 *
 * Public barrel export for the portfolio store module.
 * Import from '@/lib/store' in any part of the app.
 */

// Store types and factory (safe to import in Server Components for typing)
export type {
  InteractionMode,
  ProjectCategory,
  EvaluationRole,
  CameraCoordinates,
  PortfolioState,
  PortfolioActions,
  PortfolioStore,
  PortfolioStoreApi,
} from "./portfolio-store";
export {
  DEFAULT_PORTFOLIO_STATE,
  createPortfolioStore,
  SPEED_RUN_PROJECTS,
  SPEED_RUN_ONELINERS,
} from "./portfolio-store";

// Provider and hook (Client Components only — contains 'use client')
export type { PortfolioStoreProviderProps } from "./portfolio-store-provider";
export {
  PortfolioStoreProvider,
  usePortfolioStore,
  usePortfolioStoreApi,
} from "./portfolio-store-provider";
