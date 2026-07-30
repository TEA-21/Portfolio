/**
 * lib/store/portfolio-store.ts
 *
 * Core store definition for the gamified 3D portfolio.
 * Uses `createStore` (vanilla, not the React `create` hook) so that a NEW
 * store instance can be created for EVERY server request via the Context
 * provider, preventing state leakage across users / requests in the App Router.
 *
 * Pattern: https://zustand.docs.pmnd.rs/guides/nextjs
 */

import { createStore } from "zustand/vanilla";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The four gamified interaction modes of the portfolio. */
export type InteractionMode = "idle" | "navigation" | "speedRun" | "inspection";

/** World-space camera position. */
export interface CameraCoordinates {
  x: number;
  y: number;
  z: number;
}

/** All state held in the portfolio store. */
export interface PortfolioState {
  // --- Interaction mode ---
  mode: InteractionMode;

  // --- 3D Camera ---
  camera: CameraCoordinates;
  zoom: number;

  // --- Project focus ---
  focusedNodeId: string | null;
}

/** All actions available on the portfolio store. */
export interface PortfolioActions {
  // Interaction mode transitions
  setIdle: () => void;
  setNavigation: () => void;
  setSpeedRun: () => void;
  setInspection: () => void;

  // Generic setter (useful for middleware / tests)
  setMode: (mode: InteractionMode) => void;

  // Camera actions
  setCamera: (coords: Partial<CameraCoordinates>) => void;
  setZoom: (zoom: number) => void;
  resetCamera: () => void;

  // Project focus
  setFocusedNodeId: (id: string | null) => void;
}

/** Combined store type exposed to consumers. */
export type PortfolioStore = PortfolioState & PortfolioActions;

// ---------------------------------------------------------------------------
// Default / initial values
// ---------------------------------------------------------------------------

const DEFAULT_CAMERA: CameraCoordinates = { x: 0, y: 0, z: 10 };
const DEFAULT_ZOOM = 1;

export const DEFAULT_PORTFOLIO_STATE: PortfolioState = {
  mode: "idle",
  camera: DEFAULT_CAMERA,
  zoom: DEFAULT_ZOOM,
  focusedNodeId: null,
};

// ---------------------------------------------------------------------------
// Store factory
// ---------------------------------------------------------------------------

/**
 * Creates a fresh Zustand vanilla store per call.
 * Called inside the provider so each request (and each HMR reload in dev)
 * gets its own isolated instance — no cross-request state pollution.
 */
export function createPortfolioStore(
  initialState: Partial<PortfolioState> = {}
) {
  return createStore<PortfolioStore>()((set) => ({
    // Merge defaults with any server-supplied initial state
    ...DEFAULT_PORTFOLIO_STATE,
    ...initialState,
    // Spread nested camera correctly
    camera: {
      ...DEFAULT_PORTFOLIO_STATE.camera,
      ...(initialState.camera ?? {}),
    },

    // -----------------------------------------------------------------------
    // Interaction mode actions
    // -----------------------------------------------------------------------
    setIdle: () => set({ mode: "idle" }),
    setNavigation: () => set({ mode: "navigation" }),
    setSpeedRun: () => set({ mode: "speedRun" }),
    setInspection: () => set({ mode: "inspection" }),
    setMode: (mode) => set({ mode }),

    // -----------------------------------------------------------------------
    // Camera actions
    // -----------------------------------------------------------------------
    setCamera: (coords) =>
      set((state) => ({ camera: { ...state.camera, ...coords } })),

    setZoom: (zoom) => set({ zoom }),

    resetCamera: () => set({ camera: DEFAULT_CAMERA, zoom: DEFAULT_ZOOM }),

    // -----------------------------------------------------------------------
    // Project focus actions
    // -----------------------------------------------------------------------
    setFocusedNodeId: (id) => set({ focusedNodeId: id }),
  }));
}

/** Infer the type returned by the factory, used by the provider and hooks. */
export type PortfolioStoreApi = ReturnType<typeof createPortfolioStore>;
