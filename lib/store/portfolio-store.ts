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

/** The gamified interaction modes of the portfolio. */
export type InteractionMode =
  | "idle"
  | "navigation"
  | "speedRun"
  | "inspection"
  | "exitActionHub";

/** Project filter categories. */
export type ProjectCategory =
  | "AI Automation"
  | "Security & Systems"
  | "Full-Stack Architecture";

/** Evaluation focus roles for Speed Run mode. */
export type EvaluationRole =
  | "Full-Stack / Systems Engineering"
  | "AI Tooling"
  | "Rapid Prototyping";

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

  // --- Project focus & filtering ---
  focusedNodeId: string | null;
  activeCategories: ProjectCategory[];
  activeRole: EvaluationRole | null;

  // --- Speed Run Choreography ---
  speedRunSequence: string[];
  currentStepIndex: number;
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

  // Speed run tour actions
  startSpeedRunTour: (role: EvaluationRole) => void;
  advanceSpeedRun: () => void;

  // Camera actions
  setCamera: (coords: Partial<CameraCoordinates>) => void;
  setZoom: (zoom: number) => void;
  resetCamera: () => void;

  // Project focus
  setFocusedNodeId: (id: string | null) => void;

  // Category filtering
  toggleCategory: (category: ProjectCategory) => void;
  setActiveCategories: (categories: ProjectCategory[]) => void;
}



/** Combined store type exposed to consumers. */
export type PortfolioStore = PortfolioState & PortfolioActions;

// ---------------------------------------------------------------------------
// Default / initial values
// ---------------------------------------------------------------------------

const DEFAULT_CAMERA: CameraCoordinates = { x: 0, y: 0, z: 10 };
const DEFAULT_ZOOM = 1;
const ALL_CATEGORIES: ProjectCategory[] = [
  "AI Automation",
  "Security & Systems",
  "Full-Stack Architecture",
];

/**
 * Camera pan coordinates for each project node.
 *
 * IsometricCamera maps:
 *   store.camera.x  →  panX  (world X axis)
 *   store.camera.y  →  panY  (world Z axis via targetLookAt.set(panX, 0, panY))
 *   store.camera.z  →  (unused)
 *
 * Node world positions: parleylab(-3,0,3), zerotrust(3,0,3), mpmc(3,0,-3), civicguard(-3,0,-3)
 * So {x: worldX, y: worldZ} to correctly focus the camera on each node.
 */
const NODE_POSITIONS: Record<string, CameraCoordinates> = {
  parleylab: { x: -3, y: 3, z: 0 },
  zerotrust: { x:  3, y: 3, z: 0 },
  mpmc:      { x:  3, y: -3, z: 0 },
  civicguard: { x: -3, y: -3, z: 0 },
};

export const DEFAULT_PORTFOLIO_STATE: PortfolioState = {
  mode: "idle",
  camera: DEFAULT_CAMERA,
  zoom: DEFAULT_ZOOM,
  focusedNodeId: null,
  activeCategories: ALL_CATEGORIES,
  activeRole: null,
  speedRunSequence: [],
  currentStepIndex: 0,
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
    setIdle: () =>
      set({
        mode: "idle",
        activeRole: null,
        speedRunSequence: [],
        currentStepIndex: 0,
      }),
    setNavigation: () => set({ mode: "navigation" }),
    setSpeedRun: () => set({ mode: "speedRun" }),
    setInspection: () => set({ mode: "inspection" }),
    setMode: (mode) => set({ mode }),

    // -----------------------------------------------------------------------
    // Speed run tour actions
    // -----------------------------------------------------------------------
    startSpeedRunTour: (role: EvaluationRole) => {
      const roleSequenceMap: Record<EvaluationRole, string[]> = {
        "AI Tooling": ["parleylab", "mpmc"],
        "Full-Stack / Systems Engineering": ["mpmc", "zerotrust"],
        "Rapid Prototyping": ["civicguard", "zerotrust"],
      };

      const sequence = roleSequenceMap[role] ?? ["parleylab", "mpmc"];
      const firstNodeId = sequence[0];
      const coords = NODE_POSITIONS[firstNodeId] ?? DEFAULT_CAMERA;

      set({
        activeRole: role,
        speedRunSequence: sequence,
        currentStepIndex: 0,
        focusedNodeId: firstNodeId,
        camera: coords,
        zoom: 2.5,
        mode: "inspection",
      });
    },

    advanceSpeedRun: () => {
      set((state) => {
        const nextIndex = state.currentStepIndex + 1;
        if (nextIndex >= state.speedRunSequence.length) {
          // Sequence completed -> transition to exitActionHub
          return {
            currentStepIndex: nextIndex,
            mode: "exitActionHub",
            focusedNodeId: null,
            zoom: 1,
            camera: DEFAULT_CAMERA,
          };
        }

        // Move to next node in sequence
        const nextNodeId = state.speedRunSequence[nextIndex];
        const coords = NODE_POSITIONS[nextNodeId] ?? DEFAULT_CAMERA;

        return {
          currentStepIndex: nextIndex,
          focusedNodeId: nextNodeId,
          camera: coords,
          zoom: 2.5,
          mode: "inspection",
        };
      });
    },

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

    // -----------------------------------------------------------------------
    // Category filtering actions
    // -----------------------------------------------------------------------
    toggleCategory: (category) =>
      set((state) => {
        const exists = state.activeCategories.includes(category);
        const updated = exists
          ? state.activeCategories.filter((c) => c !== category)
          : [...state.activeCategories, category];
        return { activeCategories: updated };
      }),

    setActiveCategories: (categories) => set({ activeCategories: categories }),
  }));
}

/** Infer the type returned by the factory, used by the provider and hooks. */
export type PortfolioStoreApi = ReturnType<typeof createPortfolioStore>;
