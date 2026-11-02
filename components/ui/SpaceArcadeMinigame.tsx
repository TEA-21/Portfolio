"use client";

/**
 * components/ui/SpaceArcadeMinigame.tsx
 *
 * ARIA CADET: STARLIGHT ASCENT
 * High-octane Tomb of the Mask-style Endless Wall-Dasher in Neon Starlight Gold & Amber.
 *
 * FEATURES:
 * 1. 4-Way Wall-to-Wall Kinematic Dash:
 *    - Instant 950 px/s dash until colliding flush with solid walls.
 *    - Input buffering for fluid, continuous cornering.
 *    - Wall impact punch with metallic thud audio, camera micro-shake, and spark particles.
 * 2. Infinite Procedural Vertical Maze:
 *    - 11-column grid with guaranteed navigable paths, junctions, and side alcoves.
 *    - Starlight dots leave illuminated golden trails on traversed corridors.
 *    - Spikes on wall faces with 3-pip shield health and invulnerability flash.
 *    - Stellar Magnet (8s) and Cryo Freeze (5s) power-up collectibles.
 * 3. Rising Cosmic Plasma Surge:
 *    - Accelerates upward as altitude increases.
 *    - Proximity alert pulse when within 160px of ARIA.
 * 4. Multi-Input Support:
 *    - WASD & Arrow Keys (with scroll prevention).
 *    - Mouse & Touch swipe gestures (> 22px drag threshold).
 *    - On-screen retro cyberpunk touch D-pad.
 * 5. Warp Arrival Portal & Persistent High Scores.
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { usePortfolioStore } from "@/lib/store";
import { PixelAstronaut, AstronautPose } from "./PixelAstronaut";
import {
  ensureAudioResumed,
  playRetroCoinSound,
  playRetroExplosionSound,
  playGameOverSound,
  playVictoryFanfare,
  playRetroMenuSound,
  playWarpJumpSound,
  playWallImpactSound,
  playPowerupSound,
} from "@/lib/audio";

const COLS = 11;
const TILE_SIZE = 40;
const CANVAS_WIDTH = 440; // 11 * 40
const CANVAS_HEIGHT = 480; // 12 visible rows
const CHUNK_ROWS = 14;
const DASH_SPEED = 950; // px/s

export interface TimedSpikeConfig {
  dir: "U" | "D" | "L" | "R";
  period: number;
  offset: number;
  forceRetractedUntil?: number;
}

interface ChunkExit {
  col: number;
  runLength: number;
}

interface GridCell {
  c: number;
  r: number;
  wall: boolean;
  spike: "U" | "D" | "L" | "R" | null;
  timedSpike?: TimedSpikeConfig | null;
  item: "none" | "dot" | "magnet" | "freeze";
  visited: boolean;
}

function getTimedSpikeState(
  timedSpike: TimedSpikeConfig,
  gameTime: number
): "retracted" | "telegraph" | "extended" {
  if (timedSpike.forceRetractedUntil && gameTime < timedSpike.forceRetractedUntil) {
    return "retracted";
  }
  const cycle = (gameTime + timedSpike.offset) % timedSpike.period;
  if (cycle < 1.8) return "retracted";
  if (cycle < 2.4) return "telegraph";
  return "extended";
}

function drawSpikeGeometry(
  ctx: CanvasRenderingContext2D,
  dir: "U" | "D" | "L" | "R",
  screenX: number,
  screenY: number,
  length: number
) {
  if (dir === "U") {
    for (let sx = 0; sx < TILE_SIZE; sx += 10) {
      ctx.moveTo(screenX + sx, screenY);
      ctx.lineTo(screenX + sx + 5, screenY - length);
      ctx.lineTo(screenX + sx + 10, screenY);
    }
  } else if (dir === "D") {
    for (let sx = 0; sx < TILE_SIZE; sx += 10) {
      ctx.moveTo(screenX + sx, screenY + TILE_SIZE);
      ctx.lineTo(screenX + sx + 5, screenY + TILE_SIZE + length);
      ctx.lineTo(screenX + sx + 10, screenY + TILE_SIZE);
    }
  } else if (dir === "L") {
    for (let sy = 0; sy < TILE_SIZE; sy += 10) {
      ctx.moveTo(screenX, screenY + sy);
      ctx.lineTo(screenX - length, screenY + sy + 5);
      ctx.lineTo(screenX, screenY + sy + 10);
    }
  } else if (dir === "R") {
    for (let sy = 0; sy < TILE_SIZE; sy += 10) {
      ctx.moveTo(screenX + TILE_SIZE, screenY + sy);
      ctx.lineTo(screenX + TILE_SIZE + length, screenY + sy + 5);
      ctx.lineTo(screenX + TILE_SIZE, screenY + sy + 10);
    }
  }
}

function drawRetractedStuds(
  ctx: CanvasRenderingContext2D,
  dir: "U" | "D" | "L" | "R",
  screenX: number,
  screenY: number
) {
  if (dir === "U") {
    for (let sx = 2; sx < TILE_SIZE; sx += 10) {
      ctx.fillRect(screenX + sx, screenY, 6, 2);
    }
  } else if (dir === "D") {
    for (let sx = 2; sx < TILE_SIZE; sx += 10) {
      ctx.fillRect(screenX + sx, screenY + TILE_SIZE - 2, 6, 2);
    }
  } else if (dir === "L") {
    for (let sy = 2; sy < TILE_SIZE; sy += 10) {
      ctx.fillRect(screenX, screenY + sy, 2, 6);
    }
  } else if (dir === "R") {
    for (let sy = 2; sy < TILE_SIZE; sy += 10) {
      ctx.fillRect(screenX + TILE_SIZE - 2, screenY + sy, 2, 6);
    }
  }
}

interface DashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

type Direction = { x: number; y: number; name: "UP" | "DOWN" | "LEFT" | "RIGHT" };

const DIRS: Record<string, Direction> = {
  UP: { x: 0, y: -1, name: "UP" },
  DOWN: { x: 0, y: 1, name: "DOWN" },
  LEFT: { x: -1, y: 0, name: "LEFT" },
  RIGHT: { x: 1, y: 0, name: "RIGHT" },
};

export function SpaceArcadeMinigame() {
  const isMinigameOpen = usePortfolioStore((s) => s.isMinigameOpen);
  const setMinigameOpen = usePortfolioStore((s) => s.setMinigameOpen);
  const isAudioMuted = usePortfolioStore((s) => s.isAudioMuted);
  const toggleAudioMuted = usePortfolioStore((s) => s.toggleAudioMuted);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerSpriteRef = useRef<HTMLDivElement>(null);

  // Game UI State
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [playerPose, setPlayerPose] = useState<AstronautPose>("idle");
  const facingDirRef = useRef<1 | -1>(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [shields, setShields] = useState(3);
  const [magnetSeconds, setMagnetSeconds] = useState(0);
  const [freezeSeconds, setFreezeSeconds] = useState(0);
  const [surgeProximity, setSurgeProximity] = useState(false);

  // References for Zero-Lag RAF Kinematics
  const gridMapRef = useRef<Map<string, GridCell>>(new Map());
  const highestChunkGeneratedRef = useRef(0);
  const exitColsRef = useRef<ChunkExit[]>([{ col: 5, runLength: 1 }]);
  const gameTimeRef = useRef(0);
  const mountTimeRef = useRef(0);

  // Player Kinematics
  const playerRef = useRef({
    c: 5,
    r: 0,
    x: 5 * TILE_SIZE + TILE_SIZE / 2,
    y: 0 * TILE_SIZE + TILE_SIZE / 2,
    isDashing: false,
    dashDir: DIRS.UP,
    targetX: 5 * TILE_SIZE + TILE_SIZE / 2,
    targetY: 0 * TILE_SIZE + TILE_SIZE / 2,
    targetC: 5,
    targetR: 0,
  });

  const bufferedDirRef = useRef<Direction | null>(null);
  const invulnerableTimerRef = useRef(0);
  const magnetTimerRef = useRef(0);
  const freezeTimerRef = useRef(0);
  const warpInTimerRef = useRef(0.5);

  // Surge & Camera
  const surgeYRef = useRef(0);
  const cameraYRef = useRef(0);
  const shakeTimeRef = useRef(0);
  const shakeMagRef = useRef(0);

  // Telemetry & Particles
  const particlesRef = useRef<DashParticle[]>([]);
  const scoreRef = useRef(0);
  const shieldsRef = useRef(3);
  const altitudeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);
  const lastCoinSoundTimeRef = useRef(0);

  // Touch & Swipe gestures
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // ---------------------------------------------------------------------------
  // Load High Score & Record 200ms Mount Buffer on Open
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isMinigameOpen) {
      mountTimeRef.current = Date.now();
    }
  }, [isMinigameOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("starlight_ascent_high_score");
        if (saved) {
          setHighScore(parseInt(saved, 10));
        } else {
          // Check fallback legacy key
          const legacy = localStorage.getItem("space_arcade_high_score");
          if (legacy) setHighScore(parseInt(legacy, 10));
        }
      } catch {}
    }
  }, []);

  const saveHighScore = useCallback((newScore: number) => {
    if (typeof window !== "undefined") {
      try {
        const currentHigh = parseInt(localStorage.getItem("starlight_ascent_high_score") || "0", 10);
        if (newScore > currentHigh) {
          localStorage.setItem("starlight_ascent_high_score", String(newScore));
          setHighScore(newScore);
        }
      } catch {}
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Procedural Chunk Generator
  // ---------------------------------------------------------------------------
  const getCellKey = (c: number, r: number) => `${c},${r}`;

  const getCell = useCallback((c: number, r: number): GridCell | undefined => {
    if (c < 0 || c >= COLS) {
      return { c, r, wall: true, spike: null, item: "none", visited: false };
    }
    return gridMapRef.current.get(getCellKey(c, r));
  }, []);

  const generateChunk = useCallback((chunkIdx: number) => {
    const grid = gridMapRef.current;
    const minR = -(chunkIdx + 1) * CHUNK_ROWS + 1;
    const maxR = -chunkIdx * CHUNK_ROWS;

    // 1. Initialize entire chunk grid with solid walls
    for (let r = minR; r <= maxR; r++) {
      for (let c = 0; c < COLS; c++) {
        const isBorder = c === 0 || c === COLS - 1;
        grid.set(getCellKey(c, r), {
          c,
          r,
          wall: true,
          spike: null,
          timedSpike: null,
          item: "none",
          visited: false,
        });
      }
    }

    // 2. Starting Chunk (chunk 0) bottom floor platform & safe start
    if (chunkIdx === 0) {
      // Solid bottom boundary at row 1
      for (let c = 0; c < COLS; c++) {
        grid.set(getCellKey(c, 1), {
          c,
          r: 1,
          wall: true,
          spike: null,
          timedSpike: null,
          item: "none",
          visited: false,
        });
      }
      // Starting launch pad at row 0: col 5
      const cell = grid.get(getCellKey(5, 0));
      if (cell) {
        cell.wall = false;
        cell.spike = null;
        cell.timedSpike = null;
        cell.item = "none";
        cell.visited = true;
      }
    }

    // 3. Generative Chicane Labyrinth Engine (Strict 2-3 Tile Straights by Construction)
    const incoming = exitColsRef.current.length > 0 ? exitColsRef.current : [{ col: 5, runLength: 1 }];

    // At chunk seams: For EVERY column in exitColsRef.current, ensure grid cell at maxR is open
    incoming.forEach((b) => {
      const col = Math.max(1, Math.min(COLS - 2, b.col));
      const cell = grid.get(getCellKey(col, maxR));
      if (cell) {
        cell.wall = false;
        cell.spike = null;
        cell.timedSpike = null;
        if (cell.item === "none") cell.item = "dot";
      }
    });

    const branches = incoming.slice(0, 1);

    branches.forEach((b, branchIdx) => {
      let curC = Math.max(1, Math.min(COLS - 2, b.col));
      let curR = maxR;
      let prevHDir: 1 | -1 = curC >= 5 ? -1 : 1;

      // If incoming branch had vertical run >= 2 tiles in previous chunk,
      // cell at maxR completes a 3-tile run across the seam.
      // Force immediate horizontal turn at maxR so seam run never exceeds 3 tiles!
      let mustTurnHorizontalFirst = (chunkIdx > 0 && b.runLength >= 2);

      while (curR > minR) {
        if (!mustTurnHorizontalFirst) {
          // --- VERTICAL LEG: strictly 2 or 3 tiles UP ---
          // Step strictly by 2 rows (3 tiles total: curR, curR-1, curR-2)
          // If 1 row from minR, step by 1 row (2 tiles: curR, minR)
          const stepUp = (curR - 2 < minR) ? (curR - minR) : 2;
          const targetR = curR - stepUp;

          for (let r = curR; r >= targetR; r--) {
            const cell = grid.get(getCellKey(curC, r));
            if (cell) {
              cell.wall = false;
              if (cell.item === "none") cell.item = "dot";
            }
          }
          curR = targetR;

          if (curR <= minR) {
            break; // Reached top of chunk!
          }

          // Ceiling elbow wall with timed retracting spike (ONLY if already a wall)
          const elbowWall = grid.get(getCellKey(curC, curR - 1));
          if (elbowWall && elbowWall.wall && Math.random() < 0.35) {
            elbowWall.timedSpike = {
              dir: "D",
              period: 3.4,
              offset: (chunkIdx * 1.1 + curR * 0.4 + branchIdx * 0.7) % 3.4,
            };
          }
        }

        mustTurnHorizontalFirst = false;

        // --- HORIZONTAL LEG: strictly 2 or 3 tiles (guaranteed 90-degree turn) ---
        const preferredDir: 1 | -1 = curC >= 7 ? -1 : curC <= 3 ? 1 : (prevHDir === 1 ? -1 : 1);
        
        let chosenTargetC: number | null = null;
        let chosenDir: 1 | -1 = preferredDir;

        const candidates: { dir: 1 | -1; len: number }[] = [
          { dir: preferredDir, len: 3 },
          { dir: preferredDir, len: 2 },
          { dir: (preferredDir === 1 ? -1 : 1), len: 3 },
          { dir: (preferredDir === 1 ? -1 : 1), len: 2 },
        ];

        for (const cand of candidates) {
          const delta = cand.len - 1; // 1 or 2
          const testC = curC + cand.dir * delta;
          if (testC >= 1 && testC <= COLS - 2) {
            // Check if below is a wall, so next vertical leg doesn't merge with an existing vertical run
            const cellBelow = grid.get(getCellKey(testC, curR + 1));
            if (!cellBelow || cellBelow.wall) {
              chosenTargetC = testC;
              chosenDir = cand.dir;
              break;
            }
          }
        }

        if (chosenTargetC === null) {
          for (const cand of candidates) {
            const delta = cand.len - 1;
            const testC = curC + cand.dir * delta;
            if (testC >= 1 && testC <= COLS - 2) {
              chosenTargetC = testC;
              chosenDir = cand.dir;
              break;
            }
          }
        }

        if (chosenTargetC === null) {
          chosenDir = curC >= 5 ? -1 : 1;
          chosenTargetC = Math.max(1, Math.min(COLS - 2, curC + chosenDir));
        }

        const minC = Math.min(curC, chosenTargetC);
        const maxC = Math.max(curC, chosenTargetC);
        for (let c = minC; c <= maxC; c++) {
          const cell = grid.get(getCellKey(c, curR));
          if (cell) {
            cell.wall = false;
            if (cell.item === "none") cell.item = "dot";
          }
        }

        // Horizontal Elbow wall with timed retracting spike (ONLY if already a wall)
        const sideWallC = chosenTargetC + chosenDir;
        const sideWall = grid.get(getCellKey(sideWallC, curR));
        if (sideWall && sideWallC >= 0 && sideWallC < COLS && sideWall.wall && Math.random() < 0.35) {
          sideWall.timedSpike = {
            dir: chosenDir === 1 ? "L" : "R",
            period: 3.4,
            offset: (chunkIdx * 1.1 + curR * 0.4 + 1.2) % 3.4,
          };
        }

        prevHDir = chosenDir;
        curC = chosenTargetC;
      }
    });

    // 4. Kinematic Dash-Graph Reachability Validator (SOLE AUTHORITATIVE PASS)
    // In a wall-dasher, reachability must be evaluated on the Dash Graph (full raycasts to walls).
    const repairDashReachability = () => {
      const DIRS_LIST: Direction[] = [DIRS.UP, DIRS.DOWN, DIRS.LEFT, DIRS.RIGHT];

      // Raycast helper: from (c, r) in direction dir, advance until hitting wall or minR
      const raycastNode = (
        startC: number,
        startR: number,
        dir: Direction
      ): { c: number; r: number } | null => {
        const nextC = startC + dir.x;
        const nextR = startR + dir.y;
        const firstCell = grid.get(getCellKey(nextC, nextR));
        if (!firstCell || firstCell.wall) return null;

        let currC = nextC;
        let currR = nextR;
        while (true) {
          if (currR <= minR) {
            return { c: currC, r: currR };
          }
          const chkC = currC + dir.x;
          const chkR = currR + dir.y;
          const chkCell = grid.get(getCellKey(chkC, chkR));
          if (!chkCell || chkCell.wall) {
            return { c: currC, r: currR };
          }
          currC = chkC;
          currR = chkR;
        }
      };

      for (let pass = 0; pass < 5; pass++) {
        // Seed landing nodes from starting positions (chunk 0) or all open columns at maxR
        const seeds: { c: number; r: number }[] = [];
        if (chunkIdx === 0) {
          seeds.push({ c: 5, r: 0 });
        } else {
          for (let c = 1; c < COLS - 1; c++) {
            const cell = grid.get(getCellKey(c, maxR));
            if (cell && !cell.wall) {
              seeds.push({ c, r: maxR });
            }
          }
        }

        // Explore all reachable landing nodes using queue / visited set
        const queue: { c: number; r: number }[] = [];
        const reachableMap = new Map<string, { c: number; r: number }>();
        const adj = new Map<string, string[]>();

        seeds.forEach((s) => {
          const k = getCellKey(s.c, s.r);
          if (!reachableMap.has(k)) {
            reachableMap.set(k, s);
            queue.push(s);
          }
        });

        while (queue.length > 0) {
          const u = queue.shift()!;
          const uKey = getCellKey(u.c, u.r);
          if (!adj.has(uKey)) adj.set(uKey, []);

          for (const dir of DIRS_LIST) {
            const dest = raycastNode(u.c, u.r, dir);
            if (dest) {
              const vKey = getCellKey(dest.c, dest.r);
              adj.get(uKey)!.push(vKey);

              if (!reachableMap.has(vKey)) {
                reachableMap.set(vKey, dest);
                queue.push(dest);
              }
            }
          }
        }

        // Reverse graph reachability from all exit nodes (row <= minR)
        const reverseAdj = new Map<string, string[]>();
        const exitQueue: string[] = [];
        const canReachExit = new Set<string>();

        for (const [uKey, vKeys] of adj.entries()) {
          for (const vKey of vKeys) {
            if (!reverseAdj.has(vKey)) reverseAdj.set(vKey, []);
            reverseAdj.get(vKey)!.push(uKey);
          }
        }

        for (const [key, node] of reachableMap.entries()) {
          if (node.r <= minR) {
            canReachExit.add(key);
            exitQueue.push(key);
          }
        }

        while (exitQueue.length > 0) {
          const currKey = exitQueue.shift()!;
          const preds = reverseAdj.get(currKey) || [];
          for (const predKey of preds) {
            if (!canReachExit.has(predKey)) {
              canReachExit.add(predKey);
              exitQueue.push(predKey);
            }
          }
        }

        // Identify stuck nodes that cannot reach row <= minR
        const stuckNodes: { c: number; r: number }[] = [];
        for (const [key, node] of reachableMap.entries()) {
          if (!canReachExit.has(key)) {
            stuckNodes.push(node);
          }
        }

        if (stuckNodes.length === 0) {
          // Clean up static non-retracting spikes on critical path landing walls
          // Timed spikes are preserved to provide essential timing challenge and skill expression
          for (const [key, node] of reachableMap.entries()) {
            if (canReachExit.has(key)) {
              for (const dir of DIRS_LIST) {
                const dest = raycastNode(node.c, node.r, dir);
                if (dest && canReachExit.has(getCellKey(dest.c, dest.r))) {
                  const wallC = dest.c + dir.x;
                  const wallR = dest.r + dir.y;
                  const wallCell = grid.get(getCellKey(wallC, wallR));
                  if (wallCell && wallCell.wall) {
                    wallCell.spike = null;
                  }
                }
              }
            }
          }
          break;
        }

        // Helper to check if a cell connects to an exit path
        const isConnectedToExit = (c: number, r: number): boolean => {
          if (r <= minR) return true;
          if (canReachExit.has(getCellKey(c, r))) return true;
          const cCell = grid.get(getCellKey(c, r));
          if (cCell && !cCell.wall) {
            for (const dir of DIRS_LIST) {
              const dest = raycastNode(c, r, dir);
              if (dest && canReachExit.has(getCellKey(dest.c, dest.r))) {
                return true;
              }
            }
          }
          return false;
        };

        // For any landing node that cannot reach row <= minR: carve stepped zigzag escape connector
        for (const stuck of stuckNodes) {
          let currC = Math.max(1, Math.min(COLS - 2, stuck.c));
          let currR = stuck.r;
          let hDir: 1 | -1 = currC >= 6 ? -1 : 1;
          const carvedInThisRun: string[] = [getCellKey(currC, currR)];

          while (currR >= minR) {
            // 1. Step up to 2 tiles UP
            let reachedExit = false;
            for (let step = 0; step < 2; step++) {
              currR--;
              if (currR <= minR) {
                reachedExit = true;
                break;
              }
              const key = getCellKey(currC, currR);
              const cell = grid.get(key);
              if (cell) {
                cell.wall = false;
                cell.spike = null;
                if (cell.item === "none") cell.item = "dot";
              }
              carvedInThisRun.push(key);
              if (isConnectedToExit(currC, currR)) {
                reachedExit = true;
                break;
              }
            }

            if (reachedExit || currR <= minR) {
              carvedInThisRun.forEach((k) => canReachExit.add(k));
              break;
            }

            // 2. Step 2 tiles HORIZONTAL (wind across the grid)
            if (currC + hDir * 2 < 1 || currC + hDir * 2 >= COLS - 1) {
              hDir = hDir === 1 ? -1 : 1;
            }

            for (let step = 0; step < 2; step++) {
              const nextC = currC + hDir;
              if (nextC < 1 || nextC >= COLS - 1) break;
              currC = nextC;
              const key = getCellKey(currC, currR);
              const cell = grid.get(key);
              if (cell) {
                cell.wall = false;
                cell.spike = null;
                if (cell.item === "none") cell.item = "dot";
              }
              carvedInThisRun.push(key);
              if (isConnectedToExit(currC, currR)) {
                reachedExit = true;
                break;
              }
            }

            if (reachedExit) {
              carvedInThisRun.forEach((k) => canReachExit.add(k));
              break;
            }
          }
        }
      }
    };

    repairDashReachability();

    // Collect all open columns at minR for next chunk's incoming branches
    // CRITICAL: All open columns at minR remain open! Never set wall = true!
    const validExits: ChunkExit[] = [];
    for (let c = 1; c < COLS - 1; c++) {
      const cell = grid.get(getCellKey(c, minR));
      if (cell && !cell.wall) {
        let run = 0;
        let checkR = minR;
        while (checkR <= maxR) {
          const chk = grid.get(getCellKey(c, checkR));
          if (chk && !chk.wall) {
            run++;
            checkR++;
          } else {
            break;
          }
        }
        validExits.push({ col: c, runLength: Math.min(run, 4) });
      }
    }

    if (validExits.length > 0) {
      exitColsRef.current = validExits;
    } else {
      // Guarantee column 5 is open if no exits existed
      const safeExit = grid.get(getCellKey(5, minR));
      if (safeExit) {
        safeExit.wall = false;
        safeExit.item = "dot";
      }
      exitColsRef.current = [{ col: 5, runLength: 1 }];
    }

    highestChunkGeneratedRef.current = chunkIdx;
  }, []);

  // ---------------------------------------------------------------------------
  // Start / Reset Game
  // ---------------------------------------------------------------------------
  const startGame = useCallback(() => {
    ensureAudioResumed();
    playWarpJumpSound();

    gridMapRef.current.clear();
    particlesRef.current = [];
    exitColsRef.current = [{ col: 5, runLength: 1 }];
    gameTimeRef.current = 0;

    // Generate initial chunks (Chunk 0, 1, 2)
    generateChunk(0);
    generateChunk(1);
    generateChunk(2);

    const startX = 5 * TILE_SIZE + TILE_SIZE / 2;
    const startY = 0 * TILE_SIZE + TILE_SIZE / 2;

    playerRef.current = {
      c: 5,
      r: 0,
      x: startX,
      y: startY,
      isDashing: false,
      dashDir: DIRS.UP,
      targetX: startX,
      targetY: startY,
      targetC: 5,
      targetR: 0,
    };

    bufferedDirRef.current = null;
    invulnerableTimerRef.current = 0;
    magnetTimerRef.current = 0;
    freezeTimerRef.current = 0;
    warpInTimerRef.current = 0.5;

    surgeYRef.current = startY + 240;
    cameraYRef.current = startY - CANVAS_HEIGHT * 0.65;
    shakeTimeRef.current = 0;
    shakeMagRef.current = 0;

    scoreRef.current = 0;
    shieldsRef.current = 3;
    altitudeRef.current = 0;

    setScore(0);
    setShields(3);
    setAltitude(0);
    setMagnetSeconds(0);
    setFreezeSeconds(0);
    setSurgeProximity(false);

    setPlayerPose("idle");
    setGameState("playing");
    lastTimeRef.current = performance.now();
  }, [generateChunk]);

  // ---------------------------------------------------------------------------
  // Initiate 4-Way Wall Dash
  // ---------------------------------------------------------------------------
  const attemptDash = useCallback(
    (dir: Direction) => {
      // 200ms input ignore buffer on mount to prevent cutscene skip bleed
      if (Date.now() - mountTimeRef.current < 200) return;
      if (gameState !== "playing" || warpInTimerRef.current > 0) return;

      const p = playerRef.current;
      const grid = gridMapRef.current;

      // If already dashing: buffer the input direction
      if (p.isDashing) {
        bufferedDirRef.current = dir;
        return;
      }

      // Check immediate adjacent tile
      const nextC = p.c + dir.x;
      const nextR = p.r + dir.y;
      const nextCell = grid.get(getCellKey(nextC, nextR));

      // Cannot dash directly into a solid wall
      if (!nextCell || nextCell.wall) {
        return;
      }

      // Raycast along dash direction until collision with wall
      let destC = p.c;
      let destR = p.r;

      while (true) {
        const checkC = destC + dir.x;
        const checkR = destR + dir.y;
        const checkCell = grid.get(getCellKey(checkC, checkR));

        if (!checkCell || checkCell.wall) {
          break;
        }

        destC = checkC;
        destR = checkR;
      }

      // Lock in dash kinematics
      p.isDashing = true;
      p.dashDir = dir;
      p.targetC = destC;
      p.targetR = destR;
      p.targetX = destC * TILE_SIZE + TILE_SIZE / 2;
      p.targetY = destR * TILE_SIZE + TILE_SIZE / 2;

      setPlayerPose("thrust");
    },
    [gameState]
  );

  // ---------------------------------------------------------------------------
  // Input Listeners: Keyboard & Swipe
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isMinigameOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (Date.now() - mountTimeRef.current < 200) return;
      if (e.key === "Escape") {
        setMinigameOpen(false);
        return;
      }

      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyS", "KeyA", "KeyD"].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }

      if (e.code === "ArrowUp" || e.code === "KeyW") attemptDash(DIRS.UP);
      else if (e.code === "ArrowDown" || e.code === "KeyS") attemptDash(DIRS.DOWN);
      else if (e.code === "ArrowLeft" || e.code === "KeyA") attemptDash(DIRS.LEFT);
      else if (e.code === "ArrowRight" || e.code === "KeyD") attemptDash(DIRS.RIGHT);
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMinigameOpen, attemptDash, setMinigameOpen]);

  // Pointer / Touch Swipe Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    ensureAudioResumed();
    touchStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!touchStartPosRef.current) return;
    const dx = e.clientX - touchStartPosRef.current.x;
    const dy = e.clientY - touchStartPosRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist >= 22) {
      if (Math.abs(dx) > Math.abs(dy)) {
        attemptDash(dx > 0 ? DIRS.RIGHT : DIRS.LEFT);
      } else {
        attemptDash(dy > 0 ? DIRS.DOWN : DIRS.UP);
      }
      // Re-anchor start pos for continuous chain-swiping
      touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = () => {
    touchStartPosRef.current = null;
  };

  // ---------------------------------------------------------------------------
  // Main Game Loop (Delta-Time Normalized)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isMinigameOpen || gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(loop);

      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      gameTimeRef.current += dt;

      // Handle Warp In Countdown
      if (warpInTimerRef.current > 0) {
        warpInTimerRef.current -= dt;
      }

      // Handle Timers
      if (invulnerableTimerRef.current > 0) {
        invulnerableTimerRef.current = Math.max(0, invulnerableTimerRef.current - dt);
      }
      if (magnetTimerRef.current > 0) {
        magnetTimerRef.current = Math.max(0, magnetTimerRef.current - dt);
        setMagnetSeconds(Math.ceil(magnetTimerRef.current));
      } else if (magnetSeconds > 0) {
        setMagnetSeconds(0);
      }
      if (freezeTimerRef.current > 0) {
        freezeTimerRef.current = Math.max(0, freezeTimerRef.current - dt);
        setFreezeSeconds(Math.ceil(freezeTimerRef.current));
      } else if (freezeSeconds > 0) {
        setFreezeSeconds(0);
      }

      const p = playerRef.current;
      const grid = gridMapRef.current;

      // ── 1. Kinematic Wall Dash Update ──
      if (p.isDashing) {
        const moveDist = DASH_SPEED * dt;
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const distToTarget = Math.hypot(dx, dy);

        // Spawn square trail shard
        if (Math.random() < 0.6) {
          particlesRef.current.push({
            x: p.x + (Math.random() - 0.5) * 10,
            y: p.y + (Math.random() - 0.5) * 10,
            vx: -p.dashDir.x * 60 + (Math.random() - 0.5) * 30,
            vy: -p.dashDir.y * 60 + (Math.random() - 0.5) * 30,
            size: 4 + Math.random() * 3,
            color: Math.random() > 0.3 ? "#FBBF24" : "#38BDF8",
            life: 0.28,
            maxLife: 0.28,
          });
        }

        // Mid-Dash Intersection Cornering (Input Steering)
        let didCorner = false;
        if (
          bufferedDirRef.current &&
          p.dashDir.x * bufferedDirRef.current.x + p.dashDir.y * bufferedDirRef.current.y === 0
        ) {
          const bDir = bufferedDirRef.current;
          const currC = Math.round((p.x - TILE_SIZE / 2) / TILE_SIZE);
          const currR = Math.round((p.y - TILE_SIZE / 2) / TILE_SIZE);
          const tileCenterX = currC * TILE_SIZE + TILE_SIZE / 2;
          const tileCenterY = currR * TILE_SIZE + TILE_SIZE / 2;
          if (Math.hypot(p.x - tileCenterX, p.y - tileCenterY) <= Math.max(14, moveDist * 1.2)) {
            const turnCell = grid.get(getCellKey(currC + bDir.x, currR + bDir.y));
            if (turnCell && !turnCell.wall) {
              p.x = tileCenterX;
              p.y = tileCenterY;
              p.c = currC;
              p.r = currR;
              bufferedDirRef.current = null;
              p.isDashing = false;

              // Visit and collect dot on the cornering intersection tile
              const turnTile = grid.get(getCellKey(currC, currR));
              if (turnTile && !turnTile.wall) {
                turnTile.visited = true;
                if (turnTile.item === "dot") {
                  turnTile.item = "none";
                  scoreRef.current += 10;
                  setScore(scoreRef.current);
                  if (now - lastCoinSoundTimeRef.current > 75) {
                    playRetroCoinSound();
                    lastCoinSoundTimeRef.current = now;
                  }
                } else if (turnTile.item === "magnet") {
                  turnTile.item = "none";
                  magnetTimerRef.current = 8.0;
                  setMagnetSeconds(8);
                  playPowerupSound();
                } else if (turnTile.item === "freeze") {
                  turnTile.item = "none";
                  freezeTimerRef.current = 5.0;
                  setFreezeSeconds(5);
                  playPowerupSound();
                }
              }

              attemptDash(bDir);
              didCorner = true;
            }
          }
        }

        if (!didCorner) {
          if (distToTarget <= moveDist) {
            // Arrived flush against wall destination
            p.x = p.targetX;
            p.y = p.targetY;
            p.c = p.targetC;
            p.r = p.targetR;
            p.isDashing = false;

            // Process final destination cell
            const endCell = grid.get(getCellKey(p.c, p.r));
            if (endCell) {
              endCell.visited = true;
            }

            // Real-Time Collision with Terminating Wall Cell
            const wallC = p.c + p.dashDir.x;
            const wallR = p.r + p.dashDir.y;
            const wallCell = grid.get(getCellKey(wallC, wallR));

            let hitHazard = false;
            if (wallCell) {
              // Static spike check
              if (wallCell.spike) {
                if (
                  (p.dashDir.y === -1 && wallCell.spike === "D") ||
                  (p.dashDir.y === 1 && wallCell.spike === "U") ||
                  (p.dashDir.x === -1 && wallCell.spike === "R") ||
                  (p.dashDir.x === 1 && wallCell.spike === "L")
                ) {
                  hitHazard = true;
                }
              }

              // Timed spike check
              if (wallCell.timedSpike) {
                const sDir = wallCell.timedSpike.dir;
                const matchesDir =
                  (p.dashDir.y === -1 && sDir === "D") ||
                  (p.dashDir.y === 1 && sDir === "U") ||
                  (p.dashDir.x === -1 && sDir === "R") ||
                  (p.dashDir.x === 1 && sDir === "L");
                if (matchesDir) {
                  const state = getTimedSpikeState(wallCell.timedSpike, gameTimeRef.current);
                  if (state === "extended") {
                    hitHazard = true;
                  }
                }
              }
            }

            // Handle Spike Collision
            if (hitHazard && invulnerableTimerRef.current <= 0) {
              shieldsRef.current -= 1;
              setShields(shieldsRef.current);
              invulnerableTimerRef.current = 1.2;
              shakeTimeRef.current = 0.25;
              shakeMagRef.current = 4;
              playRetroExplosionSound();

              setPlayerPose("drag");
              setTimeout(() => {
                setPlayerPose("idle");
              }, 400);

              // Do NOT force retract spikes on collision so players see the hazard that hit them

              if (shieldsRef.current <= 0) {
                setPlayerPose("spin");
                setGameState("gameover");
                playGameOverSound();
                saveHighScore(scoreRef.current);
                return;
              }
            } else {
              setPlayerPose("idle");
              // Crisp Wall Impact
              playWallImpactSound();
              shakeTimeRef.current = 0.12;
              shakeMagRef.current = 3;

              // Emit wall impact spark particles
              for (let i = 0; i < 7; i++) {
                particlesRef.current.push({
                  x: p.x + p.dashDir.x * 12,
                  y: p.y + p.dashDir.y * 12,
                  vx: -p.dashDir.x * (80 + Math.random() * 80) + (Math.random() - 0.5) * 120,
                  vy: -p.dashDir.y * (80 + Math.random() * 80) + (Math.random() - 0.5) * 120,
                  size: 3 + Math.random() * 3,
                  color: Math.random() > 0.4 ? "#FDE68A" : "#F59E0B",
                  life: 0.25,
                  maxLife: 0.25,
                });
              }
            }

            // Process Buffered Input Direction
            if (bufferedDirRef.current) {
              const nextDir = bufferedDirRef.current;
              bufferedDirRef.current = null;
              const nextC = p.c + nextDir.x;
              const nextR = p.r + nextDir.y;
              const nextCell = grid.get(getCellKey(nextC, nextR));
              if (nextCell && !nextCell.wall) {
                attemptDash(nextDir);
              }
            }
          } else {
            // Advance along dash vector
            p.x += (dx / distToTarget) * moveDist;
            p.y += (dy / distToTarget) * moveDist;

            // Current grid cell traversal & pickup collection
            const currC = Math.floor(p.x / TILE_SIZE);
            const currR = Math.floor(p.y / TILE_SIZE);
            const currCell = grid.get(getCellKey(currC, currR));

            if (currCell && !currCell.wall) {
              currCell.visited = true;

              if (currCell.item === "dot") {
                currCell.item = "none";
                scoreRef.current += 10;
                setScore(scoreRef.current);

                if (now - lastCoinSoundTimeRef.current > 75) {
                  playRetroCoinSound();
                  lastCoinSoundTimeRef.current = now;
                }
              } else if (currCell.item === "magnet") {
                currCell.item = "none";
                magnetTimerRef.current = 8.0;
                setMagnetSeconds(8);
                playPowerupSound();
              } else if (currCell.item === "freeze") {
                currCell.item = "none";
                freezeTimerRef.current = 5.0;
                setFreezeSeconds(5);
                playPowerupSound();
              }
            }
          }
        }
      } else if (gameState === "playing" && warpInTimerRef.current <= 0 && invulnerableTimerRef.current <= 0) {
        // Stationary Spike Hazard Collision Check
        // If an adjacent wall has a spike pointing into player's cell that is currently extended, trigger damage
        let hitStationaryHazard = false;

        // Top neighbor pointing Down
        const topCell = grid.get(getCellKey(p.c, p.r - 1));
        if (topCell && topCell.wall) {
          if (topCell.spike === "D") hitStationaryHazard = true;
          if (topCell.timedSpike && topCell.timedSpike.dir === "D") {
            if (getTimedSpikeState(topCell.timedSpike, gameTimeRef.current) === "extended") {
              hitStationaryHazard = true;
            }
          }
        }

        // Bottom neighbor pointing Up
        if (!hitStationaryHazard) {
          const bottomCell = grid.get(getCellKey(p.c, p.r + 1));
          if (bottomCell && bottomCell.wall) {
            if (bottomCell.spike === "U") hitStationaryHazard = true;
            if (bottomCell.timedSpike && bottomCell.timedSpike.dir === "U") {
              if (getTimedSpikeState(bottomCell.timedSpike, gameTimeRef.current) === "extended") {
                hitStationaryHazard = true;
              }
            }
          }
        }

        // Left neighbor pointing Right
        if (!hitStationaryHazard) {
          const leftCell = grid.get(getCellKey(p.c - 1, p.r));
          if (leftCell && leftCell.wall) {
            if (leftCell.spike === "R") hitStationaryHazard = true;
            if (leftCell.timedSpike && leftCell.timedSpike.dir === "R") {
              if (getTimedSpikeState(leftCell.timedSpike, gameTimeRef.current) === "extended") {
                hitStationaryHazard = true;
              }
            }
          }
        }

        // Right neighbor pointing Left
        if (!hitStationaryHazard) {
          const rightCell = grid.get(getCellKey(p.c + 1, p.r));
          if (rightCell && rightCell.wall) {
            if (rightCell.spike === "L") hitStationaryHazard = true;
            if (rightCell.timedSpike && rightCell.timedSpike.dir === "L") {
              if (getTimedSpikeState(rightCell.timedSpike, gameTimeRef.current) === "extended") {
                hitStationaryHazard = true;
              }
            }
          }
        }

        if (hitStationaryHazard) {
          shieldsRef.current -= 1;
          setShields(shieldsRef.current);
          invulnerableTimerRef.current = 1.2;
          shakeTimeRef.current = 0.25;
          shakeMagRef.current = 4;
          playRetroExplosionSound();

          setPlayerPose("drag");
          setTimeout(() => {
            setPlayerPose("idle");
          }, 400);

          if (shieldsRef.current <= 0) {
            setPlayerPose("spin");
            setGameState("gameover");
            playGameOverSound();
            saveHighScore(scoreRef.current);
            return;
          }
        }
      }

      // ── 2. Stellar Magnet Aura Collection ──
      if (magnetTimerRef.current > 0) {
        const radius = 140;
        const cellRadius = Math.ceil(radius / TILE_SIZE);
        for (let r = p.r - cellRadius; r <= p.r + cellRadius; r++) {
          for (let c = p.c - cellRadius; c <= p.c + cellRadius; c++) {
            const cell = grid.get(getCellKey(c, r));
            if (cell && cell.item === "dot") {
              const dotX = c * TILE_SIZE + TILE_SIZE / 2;
              const dotY = r * TILE_SIZE + TILE_SIZE / 2;
              const dist = Math.hypot(dotX - p.x, dotY - p.y);
              if (dist <= radius) {
                cell.item = "none";
                scoreRef.current += 10;
                setScore(scoreRef.current);
                // Sparkle streak to player
                particlesRef.current.push({
                  x: dotX,
                  y: dotY,
                  vx: (p.x - dotX) * 4,
                  vy: (p.y - dotY) * 4,
                  size: 3,
                  color: "#FBBF24",
                  life: 0.2,
                  maxLife: 0.2,
                });
              }
            }
          }
        }
      }

      // ── 3. Altitude Tracking & Infinite Generation ──
      const currentAlt = Math.max(0, -Math.floor(p.y / TILE_SIZE));
      if (currentAlt !== altitudeRef.current) {
        altitudeRef.current = currentAlt;
        setAltitude(currentAlt);
      }

      // Dynamically generate next chunk as player ascends
      const playerChunk = Math.floor(-p.y / (CHUNK_ROWS * TILE_SIZE));
      if (playerChunk + 1 >= highestChunkGeneratedRef.current) {
        generateChunk(highestChunkGeneratedRef.current + 1);
      }

      // ── 4. Rising Cosmic Plasma Surge ──
      const isFrozen = freezeTimerRef.current > 0;
      let surgeSpeed = 62 + Math.min(150, currentAlt * 2.2);
      if (isFrozen) surgeSpeed *= 0.25;

      surgeYRef.current -= surgeSpeed * dt;

      // Check Surge Overtake
      if (p.y >= surgeYRef.current) {
        setPlayerPose("spin");
        setGameState("gameover");
        playGameOverSound();
        saveHighScore(scoreRef.current);
        return;
      }

      // Surge Proximity Alert (< 160px)
      const surgeDist = surgeYRef.current - p.y;
      setSurgeProximity(surgeDist < 160);

      // ── 5. Smooth Camera Follow & Screen Shake ──
      const targetCamY = p.y - CANVAS_HEIGHT * 0.65;
      cameraYRef.current += (targetCamY - cameraYRef.current) * Math.min(1.0, 10 * dt);

      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (shakeTimeRef.current > 0) {
        shakeTimeRef.current -= dt;
        shakeOffsetX = (Math.random() - 0.5) * shakeMagRef.current * 2;
        shakeOffsetY = (Math.random() - 0.5) * shakeMagRef.current * 2;
      }

      // ── 6. Render Frame to Canvas ──
      ctx.save();
      ctx.translate(shakeOffsetX, shakeOffsetY);

      // Deep Obsidian Space Void Background
      ctx.fillStyle = "#050811";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Subtle Background Grid
      ctx.strokeStyle = "#0d1527";
      ctx.lineWidth = 1;
      const camY = cameraYRef.current;
      const startDrawRow = Math.floor(camY / TILE_SIZE) - 1;
      const endDrawRow = Math.ceil((camY + CANVAS_HEIGHT) / TILE_SIZE) + 1;

      // Render Maze Tiles (Multi-Pass Layering)
      // Pass 1 (Floors): Corridor floors and golden illuminated visited trails
      for (let r = startDrawRow; r <= endDrawRow; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = grid.get(getCellKey(c, r));
          const screenX = c * TILE_SIZE;
          const screenY = r * TILE_SIZE - camY;

          if (!cell || !cell.wall) {
            if (cell && cell.visited) {
              // Signature Tomb of the Mask Illuminated Golden Floor
              ctx.fillStyle = "rgba(245, 158, 11, 0.16)";
              ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

              // Solid Glowing Center Trail Line
              ctx.fillStyle = "rgba(251, 191, 36, 0.4)";
              ctx.fillRect(screenX + 16, screenY + 16, 8, 8);
            } else {
              // Unvisited Dark Space Floor
              ctx.fillStyle = "#070c18";
              ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }

      // Pass 2 (Walls): Obsidian wall base, bevels, and golden borders
      for (let r = startDrawRow; r <= endDrawRow; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = grid.get(getCellKey(c, r));
          if (cell && cell.wall) {
            const screenX = c * TILE_SIZE;
            const screenY = r * TILE_SIZE - camY;

            // Neon Starlight Gold & Amber Obsidian Wall
            ctx.fillStyle = "#0f0b04";
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Glowing Amber Wall Bevel & Neon Border
            ctx.strokeStyle = "#d97706";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);

            // Inner Neon Gold Highlight
            ctx.strokeStyle = "rgba(253, 230, 138, 0.25)";
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX + 3, screenY + 3, TILE_SIZE - 6, TILE_SIZE - 6);
          }
        }
      }

      // Pass 3 (Hazards & Spikes): Static and timed spikes rendered on top of walls and adjacent floors
      for (let r = startDrawRow; r <= endDrawRow; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = grid.get(getCellKey(c, r));
          if (cell && cell.wall) {
            const screenX = c * TILE_SIZE;
            const screenY = r * TILE_SIZE - camY;

            // 1. Static Spikes on Decoy Alcove Wall
            if (cell.spike) {
              ctx.fillStyle = "#F43F5E";
              ctx.beginPath();
              drawSpikeGeometry(ctx, cell.spike, screenX, screenY, 9);
              ctx.fill();
            }

            // 2. Timed Retracting Spikes on Elbow Wall
            if (cell.timedSpike) {
              const spikeState = getTimedSpikeState(cell.timedSpike, gameTimeRef.current);
              if (spikeState === "retracted") {
                // Subtle dark metallic recessed slots
                ctx.fillStyle = "#334155";
                drawRetractedStuds(ctx, cell.timedSpike.dir, screenX, screenY);
              } else if (spikeState === "telegraph") {
                // Pulsing amber warning hazard teeth (5px height)
                const pulseColor = Math.sin(gameTimeRef.current * 18) > 0 ? "#FBBF24" : "#F59E0B";
                ctx.fillStyle = pulseColor;
                ctx.beginPath();
                drawSpikeGeometry(ctx, cell.timedSpike.dir, screenX, screenY, 5);
                ctx.fill();
              } else if (spikeState === "extended") {
                // Full sharp crimson hazard spikes (10px) with crimson shadow glow
                ctx.save();
                ctx.fillStyle = "#F43F5E";
                ctx.shadowColor = "#F43F5E";
                ctx.shadowBlur = 6;
                ctx.beginPath();
                drawSpikeGeometry(ctx, cell.timedSpike.dir, screenX, screenY, 10);
                ctx.fill();
                ctx.restore();
              }
            }
          }
        }
      }

      // Pass 4 (Items): Dots, magnets, and freeze power-up icons on top of corridors
      for (let r = startDrawRow; r <= endDrawRow; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = grid.get(getCellKey(c, r));
          if (cell && !cell.wall && cell.item && cell.item !== "none") {
            const screenX = c * TILE_SIZE;
            const screenY = r * TILE_SIZE - camY;

            if (cell.item === "dot") {
              const dotCenterX = screenX + TILE_SIZE / 2;
              const dotCenterY = screenY + TILE_SIZE / 2;

              // Glowing Starlight Diamond
              ctx.save();
              ctx.translate(dotCenterX, dotCenterY);
              ctx.rotate(now * 0.002);

              ctx.fillStyle = "#FBBF24";
              ctx.shadowColor = "#FBBF24";
              ctx.shadowBlur = 6;
              ctx.fillRect(-3, -3, 6, 6);
              ctx.restore();
            } else if (cell.item === "magnet") {
              // Floating Magnet Power-up Icon
              const mX = screenX + TILE_SIZE / 2;
              const mY = screenY + TILE_SIZE / 2 + Math.sin(now * 0.005) * 3;

              ctx.save();
              ctx.translate(mX, mY);
              ctx.strokeStyle = "#38BDF8";
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(0, 0, 8, Math.PI, 0, false);
              ctx.stroke();

              ctx.fillStyle = "#EF4444";
              ctx.fillRect(-8, 0, 4, 5);
              ctx.fillStyle = "#38BDF8";
              ctx.fillRect(4, 0, 4, 5);
              ctx.restore();
            } else if (cell.item === "freeze") {
              // Floating Cryo Snowflake Power-up Icon
              const fX = screenX + TILE_SIZE / 2;
              const fY = screenY + TILE_SIZE / 2 + Math.sin(now * 0.005 + 1) * 3;

              ctx.save();
              ctx.translate(fX, fY);
              ctx.strokeStyle = "#67E8F9";
              ctx.shadowColor = "#38BDF8";
              ctx.shadowBlur = 8;
              ctx.lineWidth = 2;
              for (let a = 0; a < 3; a++) {
                ctx.rotate(Math.PI / 3);
                ctx.beginPath();
                ctx.moveTo(-7, 0);
                ctx.lineTo(7, 0);
                ctx.stroke();
              }
              ctx.restore();
            }
          }
        }
      }

      // Render Active Particles (Trails & Sparks)
      const activeParticles: DashParticle[] = [];
      for (const pt of particlesRef.current) {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;

        if (pt.life > 0) {
          activeParticles.push(pt);
          const alpha = pt.life / pt.maxLife;
          ctx.save();
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(pt.x - pt.size / 2, pt.y - camY - pt.size / 2, pt.size, pt.size);
          ctx.restore();
        }
      }
      particlesRef.current = activeParticles;

      // ── 7. Render ARIA Cadet Sprite ──
      const ariaScreenX = p.x;
      const ariaScreenY = p.y - camY;
      const facingDir = p.dashDir.x < 0 ? -1 : p.dashDir.x > 0 ? 1 : facingDirRef.current;
      facingDirRef.current = facingDir;

      // Update ARIA Cadet DOM Sprite Ref with zero React re-render overhead
      if (playerSpriteRef.current) {
        const domX = ariaScreenX + shakeOffsetX;
        const domY = ariaScreenY + shakeOffsetY;
        playerSpriteRef.current.style.transform = `translate3d(${domX}px, ${domY}px, 0px) translate(-50%, -50%) scaleX(${facingDir})`;
        playerSpriteRef.current.style.opacity =
          invulnerableTimerRef.current > 0 && Math.floor(now / 70) % 2 === 0 ? "0.35" : "1";
        playerSpriteRef.current.style.display = gameState === "playing" ? "block" : "none";
      }

      // Warp In Emergence Portal Animation
      if (warpInTimerRef.current > 0) {
        const warpProg = Math.max(0, Math.min(1, 1 - warpInTimerRef.current / 0.5));
        const warpRadius = Math.max(0.1, 16 * warpProg);
        ctx.save();
        ctx.translate(ariaScreenX, ariaScreenY);
        ctx.rotate(now * 0.015);
        ctx.strokeStyle = "#FBBF24";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, warpRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(ariaScreenX, ariaScreenY);

      // Invulnerability Flash
      if (invulnerableTimerRef.current > 0 && Math.floor(now / 70) % 2 === 0) {
        ctx.globalAlpha = 0.35;
      }

      // Stellar Magnet Active Ring
      if (magnetTimerRef.current > 0) {
        ctx.strokeStyle = "#FBBF24";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 20 + Math.sin(now * 0.01) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Cryo Freeze Active Ring
      if (freezeTimerRef.current > 0) {
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 18 + Math.cos(now * 0.01) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Directional Thruster Flare when Dashing
      if (p.isDashing) {
        ctx.fillStyle = Math.random() > 0.4 ? "#38BDF8" : "#FBBF24";
        const flameLength = 12 + Math.random() * 8;
        ctx.fillRect(
          -p.dashDir.x * flameLength - 3,
          -p.dashDir.y * flameLength - 3,
          6,
          6
        );
      }

      ctx.restore();

      // ── 8. Render Rising Cosmic Plasma Surge ──
      const surgeScreenY = surgeYRef.current - camY;
      if (surgeScreenY < CANVAS_HEIGHT + 100) {
        // Gradient Plasma Wave
        const plasmaGrad = ctx.createLinearGradient(0, surgeScreenY, 0, surgeScreenY + 200);
        if (isFrozen) {
          plasmaGrad.addColorStop(0, "rgba(56, 189, 248, 0.85)");
          plasmaGrad.addColorStop(0.3, "rgba(14, 165, 233, 0.65)");
          plasmaGrad.addColorStop(1, "rgba(2, 6, 23, 0.95)");
        } else {
          plasmaGrad.addColorStop(0, "rgba(245, 158, 11, 0.85)");
          plasmaGrad.addColorStop(0.3, "rgba(239, 68, 68, 0.65)");
          plasmaGrad.addColorStop(1, "rgba(69, 10, 10, 0.95)");
        }

        ctx.fillStyle = plasmaGrad;
        ctx.beginPath();
        ctx.moveTo(0, surgeScreenY);

        // Dynamic Wave Crest
        for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
          const waveY =
            surgeScreenY + Math.sin(x * 0.05 + now * 0.006) * 6 + Math.cos(x * 0.03) * 4;
          ctx.lineTo(x, waveY);
        }

        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT + 50);
        ctx.lineTo(0, CANVAS_HEIGHT + 50);
        ctx.closePath();
        ctx.fill();

        // Luminous Crest Rim
        ctx.strokeStyle = isFrozen ? "#E0F2FE" : "#FDE68A";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
          const waveY =
            surgeScreenY + Math.sin(x * 0.05 + now * 0.006) * 6 + Math.cos(x * 0.03) * 4;
          if (x === 0) ctx.moveTo(x, waveY);
          else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
      }

      ctx.restore();
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (playerSpriteRef.current) {
        playerSpriteRef.current.style.display = "none";
      }
    };
  }, [isMinigameOpen, gameState, attemptDash, generateChunk, saveHighScore, magnetSeconds, freezeSeconds]);

  if (!isMinigameOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-[480px] rounded-2xl border-2 border-amber-500/50 bg-[#070b14]/95 p-4 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col gap-3 font-mono">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <h2 className="text-sm font-black text-starlight-gold tracking-wider">
              ARIA CADET // STARLIGHT ASCENT
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAudioMuted()}
              className="minigame-cursor-native cursor-pointer font-mono text-xs text-slate-400 hover:text-white transition-colors p-1"
              title="Toggle Audio"
            >
              {isAudioMuted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={() => setMinigameOpen(false)}
              className="minigame-cursor-native cursor-pointer font-mono text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors px-2 py-1"
              aria-label="Exit Game"
            >
              CLOSE ✕
            </button>
          </div>
        </div>

        {/* Real-Time Telemetry Bar */}
        <div className="flex items-center justify-between font-mono text-xs px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">ALT:</span>
            <span className="text-nebula-lavender font-bold">{altitude}m</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">SCORE:</span>
            <span className="text-starlight-gold font-bold">{score}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">SHIELDS:</span>
            <span className={shields <= 1 ? "text-rose-400 animate-pulse font-bold" : "text-emerald-400 font-bold"}>
              {"✦".repeat(Math.max(0, shields))}
            </span>
          </div>
          {magnetSeconds > 0 && (
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-400/40 animate-pulse">
              🧲 {magnetSeconds}s
            </span>
          )}
          {freezeSeconds > 0 && (
            <span className="text-[10px] font-bold text-nebula-lavender bg-nebula-violet/20 px-1.5 py-0.5 rounded border border-nebula-violet/40 animate-pulse">
              ❄ {freezeSeconds}s
            </span>
          )}
        </div>

        {/* ── 2D Endless Wall-Dasher Canvas ───────────────────────── */}
        <div className="relative w-full h-[480px] rounded-xl border border-amber-500/30 bg-black/90 overflow-hidden touch-none flex justify-center">
          <div className="relative w-[440px] h-[480px] shrink-0">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-[440px] h-[480px] block cursor-crosshair"
            />
            <div
              ref={playerSpriteRef}
              className="absolute pointer-events-none will-change-transform z-20 left-0 top-0"
              style={{ display: "none" }}
            >
              <PixelAstronaut pose={playerPose} size={38} />
            </div>
          </div>

          {/* Surge Warning Pulsing Banner */}
          {surgeProximity && gameState === "playing" && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded bg-rose-500/30 border border-rose-500 text-rose-300 font-mono text-[10px] font-black tracking-widest uppercase animate-pulse pointer-events-none">
              ⚠ PLASMA SURGE IMMINENT ⚠
            </div>
          )}

          {/* ── On-Screen Touch / Click Retro Cyber D-Pad ──────────── */}
          <div className="absolute bottom-3 right-3 flex flex-col items-center gap-1 z-30 select-none opacity-85 hover:opacity-100 transition-opacity">
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                attemptDash(DIRS.UP);
              }}
              className="w-9 h-9 rounded-md border border-amber-400/50 bg-slate-950/80 text-starlight-gold font-mono text-sm font-black flex items-center justify-center hover:bg-amber-500/30 active:scale-90 transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]"
              aria-label="Dash Up"
            >
              ▲
            </button>
            <div className="flex gap-1">
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  attemptDash(DIRS.LEFT);
                }}
                className="w-9 h-9 rounded-md border border-amber-400/50 bg-slate-950/80 text-starlight-gold font-mono text-sm font-black flex items-center justify-center hover:bg-amber-500/30 active:scale-90 transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                aria-label="Dash Left"
              >
                ◄
              </button>
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  attemptDash(DIRS.DOWN);
                }}
                className="w-9 h-9 rounded-md border border-amber-400/50 bg-slate-950/80 text-starlight-gold font-mono text-sm font-black flex items-center justify-center hover:bg-amber-500/30 active:scale-90 transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                aria-label="Dash Down"
              >
                ▼
              </button>
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  attemptDash(DIRS.RIGHT);
                }}
                className="w-9 h-9 rounded-md border border-amber-400/50 bg-slate-950/80 text-starlight-gold font-mono text-sm font-black flex items-center justify-center hover:bg-amber-500/30 active:scale-90 transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                aria-label="Dash Right"
              >
                ►
              </button>
            </div>
          </div>

          {/* Ready Overlay */}
          {gameState === "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center gap-4 animate-fade-in z-40">
              <span className="font-mono text-xl font-black text-starlight-gold drop-shadow-[0_0_14px_rgba(251,191,36,0.8)]">
                STARLIGHT ASCENT // READY
              </span>
              <p className="font-sans text-xs text-slate-300 max-w-xs leading-relaxed">
                Launch ARIA Cadet on high-speed wall-to-wall dashes! Collect golden stardust, navigate around spikes, and outclimb the rising cosmic plasma surge.
              </p>
              <div className="font-mono text-[10px] text-slate-400 max-w-xs">
                [ CONTROLS: Arrow Keys / WASD / Swipe Gestures / Touch D-Pad ]
              </div>
              <button
                onClick={startGame}
                className="minigame-cursor-native cursor-pointer mt-2 px-6 py-2.5 rounded-xl border border-amber-400 bg-amber-500/20 text-starlight-gold font-mono text-xs font-black uppercase tracking-widest hover:bg-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] active:scale-95 transition-all"
              >
                INITIATE LAUNCH ➔
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center gap-3 animate-fade-in z-40">
              <span className="font-mono text-2xl font-black text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]">
                SURGE OVERTAKE // RETREAT
              </span>
              <div className="flex flex-col gap-1 font-mono text-xs text-slate-300 my-1">
                <span>
                  Max Altitude: <strong className="text-nebula-lavender">{altitude}m</strong>
                </span>
                <span>
                  Final Score: <strong className="text-starlight-gold">{score} PTS</strong>
                </span>
                {highScore > 0 && (
                  <span className="text-slate-400 text-[11px]">
                    Cadet Record: {Math.max(score, highScore)} PTS
                  </span>
                )}
              </div>
              {score >= highScore && score > 0 && (
                <span className="font-mono text-xs text-emerald-400 animate-pulse font-bold">
                  ✦ NEW ALL-TIME RECORD ACHIEVED! ✦
                </span>
              )}
              <div className="flex gap-3 mt-3">
                <button
                  onClick={startGame}
                  className="minigame-cursor-native cursor-pointer px-5 py-2 rounded-xl border border-amber-500/70 bg-amber-500/20 text-starlight-gold font-mono text-xs font-bold uppercase tracking-widest hover:bg-amber-500/35 transition-all whitespace-nowrap"
                >
                  RE-LAUNCH CADET
                </button>
                <button
                  onClick={() => setMinigameOpen(false)}
                  className="minigame-cursor-native cursor-pointer px-5 py-2 rounded-xl border border-white/20 bg-white/10 text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all whitespace-nowrap"
                >
                  RETURN TO GALAXY
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 border-t border-white/10 pt-2 px-1">
          <span>HIGH SCORE: {Math.max(score, highScore)}</span>
          <span>PRESS [ESC] TO EXIT</span>
        </div>
      </div>
    </div>
  );
}
