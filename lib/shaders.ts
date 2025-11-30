/**
 * Infinite Lift Filter
 * Creates seamless upward scrolling motion using mod() for perfect looping
 */
export function buildInfiniteLiftFilter(width: number, height: number): string {
  const doubleHeight = height * 2;

  return [
    // Scale the source to double height to allow seamless upward movement
    `[0:v]scale=${width}:${doubleHeight}[tall]`,

    // Crop viewport and move it upward over time using mod() for looping
    `[tall]crop=${width}:${height}:0:'mod(-t*20, ${doubleHeight})'[lift]`,

    // Convert to proper output format
    `[lift]format=yuv420p[final]`
  ].join(";");
}
