// The Monster-style three-slash claw, authored in the can's 190×369 coordinate
// space (from the CAN_SVG template). Reused three ways: filled with the can's ink
// on every can (via the shared <defs> in can-defs.tsx), and as a standalone green
// glyph in the line headers and tab bar.

/** Claw paths in the can's native (190×369) coordinate space. */
export const CLAW_PATHS = [
  'M 99.0 203.5 L 94.0 203.5 L 92.5 202.0 L 91.5 179.0 L 89.5 176.0 L 90.5 171.0 L 93.5 165.0 L 93.5 161.0 L 95.5 157.0 L 95.5 154.0 L 94.5 153.0 L 94.5 150.0 L 93.5 149.0 L 93.5 137.0 L 94.5 136.0 L 92.5 133.0 L 92.5 122.0 L 91.5 121.0 L 92.5 120.0 L 92.5 116.0 L 90.5 114.0 L 90.5 105.0 L 89.5 104.0 L 89.5 102.0 L 87.0 98.5 L 78.0 97.5 L 76.5 99.0 L 76.5 106.0 L 71.5 110.0 L 71.5 117.0 L 73.5 119.0 L 72.5 120.0 L 73.5 121.0 L 70.5 125.0 L 70.5 130.0 L 71.5 131.0 L 70.5 135.0 L 71.5 136.0 L 71.5 139.0 L 73.5 143.0 L 75.5 145.0 L 74.5 147.0 L 75.5 148.0 L 72.5 153.0 L 72.5 156.0 L 73.5 157.0 L 73.5 160.0 L 72.5 161.0 L 74.5 164.0 L 74.5 167.0 L 72.5 171.0 L 72.5 174.0 L 71.5 175.0 L 71.5 178.0 L 70.5 179.0 L 70.5 182.0 L 71.5 183.0 L 71.5 193.0 L 70.5 194.0 L 71.5 195.0 L 71.5 198.0 L 72.5 199.0 L 71.5 200.0 L 71.5 203.0 L 69.0 203.5 L 67.5 200.0 L 67.5 195.0 L 65.5 192.0 L 65.5 189.0 L 66.5 188.0 L 64.5 184.0 L 64.5 179.0 L 63.5 178.0 L 64.5 176.0 L 63.5 174.0 L 66.5 170.0 L 65.5 168.0 L 65.5 160.0 L 63.5 157.0 L 64.5 156.0 L 64.5 149.0 L 63.5 148.0 L 63.5 142.0 L 59.5 134.0 L 59.5 129.0 L 60.5 128.0 L 60.5 125.0 L 62.5 121.0 L 62.5 113.0 L 61.5 112.0 L 61.5 110.0 L 58.5 107.0 L 59.5 106.0 L 58.5 103.0 L 56.0 100.5 L 48.0 98.5 L 47.5 98.0 L 49.0 96.5 L 51.0 96.5 L 54.0 94.5 L 55.0 95.5 L 60.0 94.5 L 65.0 90.5 L 67.0 93.5 L 71.0 95.5 L 73.0 94.5 L 75.0 96.5 L 77.0 96.5 L 82.0 93.5 L 85.0 93.5 L 89.0 91.5 L 92.0 91.5 L 98.0 88.5 L 101.0 90.5 L 105.0 91.5 L 107.5 94.0 L 107.5 95.0 L 111.5 98.0 L 109.5 99.0 L 109.5 100.0 L 103.5 108.0 L 103.5 111.0 L 104.5 112.0 L 103.5 113.0 L 103.5 116.0 L 104.5 117.0 L 104.5 126.0 L 105.5 127.0 L 105.5 133.0 L 103.5 135.0 L 104.5 137.0 L 103.5 139.0 L 103.5 147.0 L 105.5 151.0 L 105.5 155.0 L 101.5 162.0 L 101.5 165.0 L 98.5 170.0 L 98.5 173.0 L 99.5 174.0 L 98.5 176.0 L 99.5 178.0 L 99.5 187.0 L 98.5 188.0 L 98.5 198.0 L 97.5 199.0 L 99.5 202.0 L 99.0 203.5 Z',
  'M 126.0 203.5 L 125.5 202.0 L 126.5 201.0 L 126.5 195.0 L 125.5 194.0 L 125.5 190.0 L 126.5 189.0 L 126.5 184.0 L 127.5 183.0 L 126.5 179.0 L 128.5 175.0 L 128.5 156.0 L 127.5 155.0 L 127.5 143.0 L 124.5 137.0 L 124.5 132.0 L 125.5 130.0 L 123.5 127.0 L 126.5 124.0 L 126.5 122.0 L 125.5 121.0 L 126.5 119.0 L 126.5 108.0 L 122.0 104.5 L 119.0 105.5 L 118.0 104.5 L 113.0 103.5 L 112.5 102.0 L 115.0 99.5 L 122.0 97.5 L 125.0 93.5 L 129.0 91.5 L 131.0 93.5 L 133.0 93.5 L 136.5 97.0 L 135.5 98.0 L 137.5 101.0 L 137.5 105.0 L 138.5 107.0 L 136.5 110.0 L 136.5 113.0 L 134.5 116.0 L 133.5 121.0 L 131.5 124.0 L 131.5 133.0 L 133.5 135.0 L 132.5 136.0 L 132.5 141.0 L 131.5 142.0 L 131.5 145.0 L 134.5 150.0 L 134.5 158.0 L 132.5 161.0 L 132.5 169.0 L 133.5 170.0 L 133.5 172.0 L 131.5 175.0 L 131.5 194.0 L 129.5 196.0 L 129.5 199.0 L 128.5 201.0 L 126.0 203.5 Z',
];

/** Tight viewBox framing just the claw, for the standalone glyph. */
export const CLAW_VIEWBOX = '47 88 91 116';

/** Just the claw `<path>`s — embed inside an existing SVG (e.g. the can) with the
 *  caller providing the fill via a group/class. */
export function ClawPaths({ fill }: { fill?: string }) {
  return (
    <g fill={fill}>
      {CLAW_PATHS.map((d) => (
        <path d={d} />
      ))}
    </g>
  );
}

interface ClawProps {
  fill: string;
  size?: number;
  title?: string;
  class?: string;
}

/** Standalone claw glyph (line headers, tab bar). */
export function Claw({ fill, size = 24, title, class: className }: ClawProps) {
  const vb = CLAW_VIEWBOX.split(' ').map(Number);
  const aspect = vb[2] / vb[3];
  return (
    <svg
      viewBox={CLAW_VIEWBOX}
      width={size * aspect}
      height={size}
      class={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <ClawPaths fill={fill} />
    </svg>
  );
}
