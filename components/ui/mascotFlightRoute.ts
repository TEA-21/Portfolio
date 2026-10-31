/**
 * components/ui/mascotFlightRoute.ts
 *
 * Acrobatic flight paths for ARIA Cadet summon based on Flight route.png:
 * 1. LEFT APPROACH (pos.x < targetX):
 *    - Inbound entry arcing over the top-left of the click circle.
 *    - Sweeps down the right flank.
 *    - Rounds under the bottom.
 *    - Pulls vertically straight upward from below (relX = 0, vy < 0) into (0, 0) target center at dead stop (0.0°).
 *
 * 2. RIGHT APPROACH (pos.x >= targetX):
 *    - Inbound entry diving diagonally from top-right towards the left flank of the click circle.
 *    - Rounds the left flank and sweeps under the bottom.
 *    - Pulls vertically straight upward from below (relX = 0, vy < 0) into (0, 0) target center at dead stop (0.0°).
 *
 * Samples are pre-computed at uniform arc-length intervals: [relX, relY, tiltDeg].
 * Coordinates are normalized to unit radius (multiply by radius in pixels).
 * Tilt values strictly follow true geometric tangent: atan2(dy, dx) * 180 / PI + 90.
 */

export const LEFT_APPROACH_SAMPLES: ReadonlyArray<readonly [number, number, number]> = [
  [-0.8500, -1.0500,   63.2],
  [-0.7696, -1.0906,   63.7],
  [-0.6885, -1.1297,   65.2],
  [-0.6061, -1.1661,   67.7],
  [-0.5219, -1.1980,   71.3],
  [-0.4356, -1.2238,   75.7],
  [-0.3475, -1.2423,   80.4],
  [-0.2582, -1.2537,   84.9],
  [-0.1683, -1.2584,   89.1],
  [-0.0782, -1.2566,   93.1],
  [ 0.0115, -1.2486,   97.0],
  [ 0.1004, -1.2348,  100.7],
  [ 0.1883, -1.2151,  104.5],
  [ 0.2747, -1.1898,  108.2],
  [ 0.3593, -1.1590,  111.8],
  [ 0.4418, -1.1228,  115.6],
  [ 0.5217, -1.0813,  119.3],
  [ 0.5988, -1.0348,  122.9],
  [ 0.6728, -0.9834,  126.7],
  [ 0.7432, -0.9273,  130.4],
  [ 0.8098, -0.8667,  134.2],
  [ 0.8723, -0.8018,  138.0],
  [ 0.9303, -0.7330,  141.8],
  [ 0.9836, -0.6604,  145.7],
  [ 1.0318, -0.5843,  149.7],
  [ 1.0744, -0.5050,  153.8],
  [ 1.1111, -0.4228,  158.1],
  [ 1.1415, -0.3380,  162.4],
  [ 1.1656, -0.2513,  166.6],
  [ 1.1832, -0.1630,  170.8],
  [ 1.1944, -0.0736,  174.9],
  [ 1.1991,  0.0163,  179.1],
  [ 1.1972,  0.1063, -176.7],
  [ 1.1886,  0.1960, -172.3],
  [ 1.1731,  0.2847, -167.9],
  [ 1.1508,  0.3719, -163.5],
  [ 1.1221,  0.4573, -159.4],
  [ 1.0876,  0.5404, -155.6],
  [ 1.0478,  0.6212, -152.0],
  [ 1.0032,  0.6994, -148.7],
  [ 0.9542,  0.7750, -145.6],
  [ 0.9015,  0.8480, -142.7],
  [ 0.8451,  0.9182, -139.4],
  [ 0.7843,  0.9847, -135.1],
  [ 0.7181,  1.0456, -129.5],
  [ 0.6456,  1.0990, -122.5],
  [ 0.5667,  1.1421, -114.2],
  [ 0.4820,  1.1725, -104.9],
  [ 0.3934,  1.1883,  -95.2],
  [ 0.3035,  1.1888,  -84.6],
  [ 0.2153,  1.1715,  -71.3],
  [ 0.1349,  1.1317,  -53.6],
  [ 0.0731,  1.0668,  -35.2],
  [ 0.0327,  0.9866,  -23.7],
  [ 0.0000,  0.8999,  -10.5],
  [ 0.0000,  0.8106,    0.0],
  [ 0.0000,  0.7205,    0.0],
  [ 0.0000,  0.6305,    0.0],
  [ 0.0000,  0.5404,    0.0],
  [ 0.0000,  0.4503,    0.0],
  [ 0.0000,  0.3603,    0.0],
  [ 0.0000,  0.2702,    0.0],
  [ 0.0000,  0.1801,    0.0],
  [ 0.0000,  0.0901,    0.0],
  [ 0.0000,  0.0000,    0.0],
];

export const RIGHT_APPROACH_SAMPLES: ReadonlyArray<readonly [number, number, number]> = [
  [ 0.9500, -1.1500, -136.2],
  [ 0.8939, -1.0915, -136.1],
  [ 0.8377, -1.0331, -136.0],
  [ 0.7814, -0.9749, -135.8],
  [ 0.7247, -0.9170, -135.4],
  [ 0.6676, -0.8594, -135.0],
  [ 0.6101, -0.8024, -134.5],
  [ 0.5520, -0.7459, -133.9],
  [ 0.4932, -0.6901, -133.1],
  [ 0.4337, -0.6351, -132.4],
  [ 0.3735, -0.5809, -131.8],
  [ 0.3128, -0.5271, -131.4],
  [ 0.2519, -0.4737, -131.2],
  [ 0.1910, -0.4203, -131.3],
  [ 0.1303, -0.3667, -131.7],
  [ 0.0700, -0.3125, -132.3],
  [ 0.0104, -0.2576, -133.2],
  [-0.0482, -0.2016, -134.4],
  [-0.1055, -0.1443, -135.6],
  [-0.1615, -0.0857, -136.7],
  [-0.2167, -0.0264, -137.0],
  [-0.2720,  0.0328, -136.6],
  [-0.3281,  0.0912, -135.3],
  [-0.3859,  0.1481, -133.4],
  [-0.4459,  0.2026, -130.8],
  [-0.5085,  0.2540, -127.8],
  [-0.5739,  0.3018, -124.4],
  [-0.6422,  0.3454, -120.9],
  [-0.7129,  0.3849, -118.3],
  [-0.7849,  0.4222, -117.5],
  [-0.8567,  0.4596, -118.6],
  [-0.9272,  0.4997, -122.1],
  [-0.9939,  0.5456, -129.2],
  [-1.0523,  0.6016, -141.9],
  [-1.0925,  0.6714, -161.2],
  [-1.1032,  0.7513,  178.8],
  [-1.0891,  0.8308,  164.0],
  [-1.0589,  0.9059,  153.4],
  [-1.0168,  0.9751,  144.1],
  [-0.9642,  1.0366,  134.2],
  [-0.9013,  1.0875,  123.4],
  [-0.8298,  1.1253,  113.1],
  [-0.7529,  1.1507,  104.7],
  [-0.6734,  1.1662,   98.6],
  [-0.5928,  1.1748,   94.7],
  [-0.5120,  1.1795,   92.5],
  [-0.4310,  1.1820,   90.2],
  [-0.3500,  1.1802,   85.7],
  [-0.2697,  1.1698,   77.3],
  [-0.1928,  1.1449,   64.2],
  [-0.1256,  1.1001,   48.2],
  [-0.0735,  1.0383,   34.2],
  [-0.0353,  0.9670,   23.5],
  [-0.0091,  0.8904,   12.7],
  [ 0.0000,  0.8103,    3.2],
  [ 0.0000,  0.7293,    0.0],
  [ 0.0000,  0.6483,    0.0],
  [ 0.0000,  0.5672,    0.0],
  [ 0.0000,  0.4862,    0.0],
  [ 0.0000,  0.4052,    0.0],
  [ 0.0000,  0.3241,    0.0],
  [ 0.0000,  0.2431,    0.0],
  [ 0.0000,  0.1621,    0.0],
  [ 0.0000,  0.0810,    0.0],
  [ 0.0000,  0.0000,    0.0],
];

/**
 * Samples the acrobatic swoop path using uniform arc-length parameterization.
 * 
 * @param approachSide Approach side determined by mascot initial position relative to click target.
 * @param p Normalized progress in [0, 1].
 * @param radius Swoop circle radius in pixels (base 72px, scaled dynamically for edge-safety).
 * @returns { relX: number, relY: number, tilt: number }
 */
export function sampleFlightSwoop(
  approachSide: "left" | "right",
  p: number,
  radius: number = 72
): { relX: number; relY: number; tilt: number } {
  const clampedP = Math.min(Math.max(p, 0), 1);
  const samples = approachSide === "left" ? LEFT_APPROACH_SAMPLES : RIGHT_APPROACH_SAMPLES;
  const total = samples.length - 1;
  const idx = clampedP * total;
  const i0 = Math.floor(idx);
  const i1 = Math.min(i0 + 1, total);
  const frac = idx - i0;

  const p0 = samples[i0];
  const p1 = samples[i1];

  let relX = (p0[0] + (p1[0] - p0[0]) * frac) * radius;
  let relY = (p0[1] + (p1[1] - p0[1]) * frac) * radius;

  // Shortest-arc angular interpolation between sample tilts
  let dTilt = p1[2] - p0[2];
  while (dTilt > 180) dTilt -= 360;
  while (dTilt < -180) dTilt += 360;
  let tilt = p0[2] + dTilt * frac;

  while (tilt > 180) tilt -= 360;
  while (tilt <= -180) tilt += 360;

  // Strict mathematical guarantee: Final segment (p >= 0.85) is purely vertical upward ingress
  if (clampedP >= 0.85) {
    relX = 0;
  }
  if (clampedP >= 1.0) {
    relX = 0;
    relY = 0;
    tilt = 0;
  }

  return { relX, relY, tilt };
}

/**
 * Backwards compatibility fallback for legacy callers.
 */
export function sampleFlightPath(
  p: number,
  scale: number = 1.0
): { relX: number; relY: number; tilt: number } {
  return sampleFlightSwoop("left", p, 72 * scale);
}
