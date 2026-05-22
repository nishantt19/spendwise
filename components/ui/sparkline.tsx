/**
 * Pure SVG sparkline — renders a filled area chart from a numeric data array.
 * Used in stat cards (dashboard KPIs) and the transactions expense card.
 * No dependencies beyond React.
 */

type SparklineProps = {
  data: number[];
  stroke?: string;
  fill?: string;
  width?: number;
  height?: number;
};

export function Sparkline({
  data,
  stroke = "var(--primary)",
  fill = "var(--primary-soft)",
  width = 120,
  height = 28,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);

  const pts = data.map((v, i) => [
    i * stepX,
    height - ((v - min) / span) * (height - 4) - 2,
  ]);

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");

  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}
    >
      <path d={area} fill={fill} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={stroke} />
    </svg>
  );
}
