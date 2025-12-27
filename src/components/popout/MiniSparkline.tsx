/**
 * MiniSparkline - Tiny inline chart for popout tiles
 * Shows recent trend data as a simple line/bar chart
 */

import { colors } from "../ui";

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  type?: "line" | "bar";
  showArea?: boolean;
}

export function MiniSparkline({
  data,
  width = 60,
  height = 20,
  color = colors.info,
  type = "line",
  showArea = true,
}: MiniSparklineProps) {
  if (!data || data.length < 2) {
    return null;
  }

  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Normalize data points
  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * chartWidth,
    y: padding + chartHeight - ((val - min) / range) * chartHeight,
  }));

  if (type === "bar") {
    const barWidth = chartWidth / data.length - 1;
    return (
      <svg width={width} height={height} style={{ display: "block" }}>
        {data.map((val, i) => {
          const barHeight = ((val - min) / range) * chartHeight;
          return (
            <rect
              key={i}
              x={padding + i * (barWidth + 1)}
              y={padding + chartHeight - barHeight}
              width={barWidth}
              height={barHeight}
              fill={color}
              opacity={0.7}
              rx={1}
            />
          );
        })}
      </svg>
    );
  }

  // Line chart
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = showArea
    ? `${linePath} L ${points[points.length - 1].x} ${
        padding + chartHeight
      } L ${points[0].x} ${padding + chartHeight} Z`
    : "";

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {/* Area fill */}
      {showArea && <path d={areaPath} fill={color} opacity={0.15} />}
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill={color}
      />
    </svg>
  );
}

/**
 * Trend indicator - shows if value is going up or down
 */
interface TrendIndicatorProps {
  current: number;
  previous: number;
  size?: number;
}

export function TrendIndicator({
  current,
  previous,
  size = 10,
}: TrendIndicatorProps) {
  const diff = current - previous;
  if (Math.abs(diff) < 0.001) return null;

  const isUp = diff > 0;
  const color = isUp ? colors.success : colors.danger;

  return (
    <svg width={size} height={size} viewBox="0 0 10 10">
      {isUp ? (
        <path d="M5 2 L8 6 L2 6 Z" fill={color} />
      ) : (
        <path d="M5 8 L8 4 L2 4 Z" fill={color} />
      )}
    </svg>
  );
}
