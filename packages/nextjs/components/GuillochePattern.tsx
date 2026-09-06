import React, { useMemo } from "react";

export type GuillocheVariant = "rosette" | "waves" | "seal" | "corner" | "watermark";

export type GuillochePatternProps = {
  variant?: GuillocheVariant;
  className?: string;
  color?: "emerald" | "gold" | "ink" | "current";
  strokeWidth?: number;
  opacity?: number;
  width?: number | string;
  height?: number | string;
};

const COLOR_MAP = {
  emerald: "#0E5E4A",
  gold: "#C9A227",
  ink: "#14201C",
  current: "currentColor",
} as const;

/**
 * Deterministic mathematical Guilloche SVG pattern generator.
 * Emulates the fine security-engraving lines found on government bonds and banknotes.
 * Completely deterministic, zero external raster/assets.
 */
export const GuillochePattern: React.FC<GuillochePatternProps> = ({
  variant = "rosette",
  className = "",
  color = "emerald",
  strokeWidth = 1,
  opacity = 1,
  width,
  height,
}) => {
  const strokeColor = COLOR_MAP[color] || color;

  // 1. Rosette (hypotrochoid multi-lobed petals)
  const rosettePaths = useMemo(() => {
    if (variant !== "rosette" && variant !== "seal" && variant !== "watermark") return [];
    const cx = 150;
    const cy = 150;
    const curves = [
      { R: 96, r: 36, d: 48, steps: 360 },
      { R: 90, r: 24, d: 38, steps: 320 },
      { R: 104, r: 40, d: 52, steps: 400 },
      { R: 84, r: 28, d: 32, steps: 280 },
    ];

    return curves.map(({ R, r, d, steps }) => {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const periods = r / gcd(R, r);
      const totalSteps = Math.min(steps, periods * 90);
      const maxTheta = 2 * Math.PI * periods;

      let pathStr = "";
      for (let i = 0; i <= totalSteps; i++) {
        const theta = (i / totalSteps) * maxTheta;
        const x = cx + (R - r) * Math.cos(theta) + d * Math.cos(((R - r) * theta) / r);
        const y = cy + (R - r) * Math.sin(theta) - d * Math.sin(((R - r) * theta) / r);
        pathStr += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      return pathStr;
    });
  }, [variant]);

  // 2. Waves (interlaced sinusoidal security ribbons)
  const wavePaths = useMemo(() => {
    if (variant !== "waves") return [];
    const w = 1000;
    const lines = 7;
    const paths: string[] = [];

    for (let l = 0; l < lines; l++) {
      const yCenter = 20 + l * 16;
      const phase = l * 0.35;
      const amp = 14 + (l % 3) * 4;
      let dStr = "";
      for (let x = 0; x <= w; x += 8) {
        const y = yCenter + amp * Math.sin(x * 0.018 + phase) + amp * 0.45 * Math.cos(x * 0.036 + phase * 1.5);
        dStr += x === 0 ? `M ${x} ${y.toFixed(2)}` : ` L ${x} ${y.toFixed(2)}`;
      }
      paths.push(dStr);
    }
    return paths;
  }, [variant]);

  // 3. Corner flourish (interlaced quadrant arcs)
  const cornerPaths = useMemo(() => {
    if (variant !== "corner") return [];
    const paths: string[] = [];
    for (let r = 20; r <= 140; r += 8) {
      paths.push(`M 0 ${r} A ${r} ${r} 0 0 0 ${r} 0`);
      paths.push(`M 10 ${r - 5} A ${r} ${r} 0 0 0 ${r - 5} 10`);
    }
    return paths;
  }, [variant]);

  if (variant === "waves") {
    return (
      <svg
        viewBox="0 0 1000 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ width: width ?? "100%", height: height ?? "auto", opacity }}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {wavePaths.map((d, idx) => (
          <path
            key={idx}
            d={d}
            stroke={idx % 2 === 0 ? strokeColor : "#C9A227"}
            strokeWidth={strokeWidth}
            strokeOpacity={0.6 + (idx % 3) * 0.15}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    );
  }

  if (variant === "corner") {
    return (
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ width: width ?? 160, height: height ?? 160, opacity }}
        aria-hidden="true"
      >
        {cornerPaths.map((d, idx) => (
          <path
            key={idx}
            d={d}
            stroke={idx % 3 === 0 ? "#C9A227" : strokeColor}
            strokeWidth={strokeWidth}
            strokeOpacity={0.5 + (idx % 2) * 0.3}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    );
  }

  if (variant === "seal") {
    return (
      <svg
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ width: width ?? 300, height: height ?? 300, opacity }}
        aria-hidden="true"
      >
        {/* Outer notched coin/seal border */}
        <circle cx="150" cy="150" r="144" stroke="#C9A227" strokeWidth={2} strokeDasharray="3 3" />
        <circle cx="150" cy="150" r="138" stroke="#0E5E4A" strokeWidth={1.5} />
        <circle cx="150" cy="150" r="132" stroke="#C9A227" strokeWidth={0.75} />
        {/* Inner Guilloche curves */}
        {rosettePaths.map((d, idx) => (
          <path
            key={idx}
            d={d}
            stroke={idx % 2 === 0 ? strokeColor : "#C9A227"}
            strokeWidth={strokeWidth}
            strokeOpacity={0.75}
          />
        ))}
        <circle cx="150" cy="150" r="44" stroke="#C9A227" strokeWidth={1} fill="#FAF6EC" fillOpacity={0.92} />
        <circle cx="150" cy="150" r="40" stroke="#0E5E4A" strokeWidth={1.5} strokeDasharray="2 2" />
      </svg>
    );
  }

  // Default: Rosette or watermark
  return (
    <svg
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: width ?? "100%", height: height ?? "100%", opacity }}
      aria-hidden="true"
    >
      <circle cx="150" cy="150" r="142" stroke="#C9A227" strokeWidth={1} strokeDasharray="4 4" strokeOpacity={0.5} />
      {rosettePaths.map((d, idx) => (
        <path
          key={idx}
          d={d}
          stroke={idx % 2 === 0 ? strokeColor : "#C9A227"}
          strokeWidth={strokeWidth}
          strokeOpacity={0.8}
        />
      ))}
    </svg>
  );
};
