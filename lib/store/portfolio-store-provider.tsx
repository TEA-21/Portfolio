"use client";

/**
 * lib/store/portfolio-store-provider.tsx
 *
 * React Context provider that wraps the vanilla Zustand store.
 *
 * WHY THIS PATTERN?
 * -----------------
 * The Next.js App Router renders layouts and pages on the server. A module-level
 * `create()` call would produce a SINGLETON shared across all requests, leaking
 * state between users.  By instantiating the store inside a Client Component
 * with `useRef`, we guarantee:
 *  1. One store instance per browser session (created once on mount, stable
 *     across re-renders via `useRef`).
 *  2. No server-side singleton — the provider itself is `'use client'` and never
 *     runs during SSR in a way that persists between requests.
 *  3. Hydration safety — initial state can be passed as a prop from any
 *     Server Component and will match between server HTML and client hydration.
 *
 * USAGE (in app/layout.tsx or any Server Component):
 * ---------------------------------------------------
 *   import { PortfolioStoreProvider } from '@/lib/store/portfolio-store-provider';
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html>
 *         <body>
 *           <PortfolioStoreProvider>
 *             {children}
 *           </PortfolioStoreProvider>
 *         </body>
 *       </html>
 *     );
 *   }
 */

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import {
  createPortfolioStore,
  type PortfolioState,
  type PortfolioStore,
  type PortfolioStoreApi,
} from "./portfolio-store";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const PortfolioStoreContext = createContext<PortfolioStoreApi | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface PortfolioStoreProviderProps {
  /** Children that will have access to the store. */
  children: ReactNode;
  /**
   * Optional initial state passed down from a Server Component.
   * Merges with defaults so callers only need to provide the keys they care about.
   */
  initialState?: Partial<PortfolioState>;
}

export function PortfolioStoreProvider({
  children,
  initialState,
}: PortfolioStoreProviderProps) {
  /**
   * `useRef` ensures the store is created exactly once per component instance
   * and is stable across re-renders without triggering additional effects.
   */
  const storeRef = useRef<PortfolioStoreApi | null>(null);

  if (storeRef.current === null) {
    storeRef.current = createPortfolioStore(initialState);
  }

  return (
    <PortfolioStoreContext.Provider value={storeRef.current}>
      {children}
    </PortfolioStoreContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Custom hook
// ---------------------------------------------------------------------------

/**
 * Selector-based hook for consuming the portfolio store.
 *
 * Using a selector means components only re-render when the selected slice
 * of state changes — critical for keeping 3D renders performant.
 *
 * @example
 *   const mode = usePortfolioStore((s) => s.mode);
 *   const { setNavigation, setCamera } = usePortfolioStore((s) => ({
 *     setNavigation: s.setNavigation,
 *     setCamera: s.setCamera,
 *   }));
 */
export function usePortfolioStore<T>(
  selector: (state: PortfolioStore) => T
): T {
  const store = useContext(PortfolioStoreContext);

  if (store === null) {
    throw new Error(
      "[PortfolioStore] `usePortfolioStore` must be used inside a <PortfolioStoreProvider>. " +
        "Ensure the provider wraps your application root in app/layout.tsx."
    );
  }

  return useStore(store, selector);
}
