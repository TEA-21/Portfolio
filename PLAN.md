# Implementation Plan — Mascot Erratic & Non-Straight Roaming Flight

## Problem
Currently, ARIA Cadet periodically fires a single linear impulse towards a random point, traveling a fixed distance in a straight line before friction halts it. The movement feels repetitive and mechanical.

## Refinements & 5 Kinematics Edge-Case Fixes
1. **Normalized Steering & Orbital Lock Prevention**:
   - Normalize target vector $(\Delta x, \Delta y)$ to unit vector $(\hat{u}_x, \hat{u}_y)$.
   - Curvature attenuation within $180\text{px}$ of target:
     `activeCurvature = roam.curvature * (1 - progress * 0.85) * distFactor`.
   - Prevents orbiting around the destination.
2. **True S-Curves via Mid-Flight Inflection**:
   - `isSCurve` ($50\%$ chance for Patrol arcs and Cross-screen dashes).
   - Invert `curveDirection *= -1` once at $45\% - 55\%$ progress to generate natural S-curves.
3. **Anti-Wall-Trapping & Audio Debounce on Pinball Bounces**:
   - Strict clamping of `pos.x, pos.y` inside viewport.
   - Velocity reflection (`* -0.75`), `roam.curvature *= 0.5`, invert `curveDirection`.
   - Push `targetX / targetY` at least $120\text{px}$ away from struck wall so forward seek force does not steer back into the border.
   - Debounce `playRetroBounceSound()` with $150\text{ms}$ cooldown.
4. **Zero-Re-Render Pose Management**:
   - Maintain `poseRef = useRef("idle")`.
   - `updatePose(newPose)` only calls `setPose` when `poseRef.current !== newPose`.
5. **Clean Guardrail Interruption Reset**:
   - `resetRoamToIdle` zeroes out roam timers, roll angles, restores upright orientation, and switches cleanly to `"idle"` whenever hovered, dragged, summoned, HUD opened, or Speed Run started.

## Verification
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: Exit code 0.
