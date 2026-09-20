import { useMemo, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import { ChartWidgetT } from "@/src/api";
import { useApp } from "@/src/context/AppContext";
import { colors, fonts, radius, spacing, type } from "@/src/theme";

// Responsive SST / wave / wind trend line chart (react-native-svg).
// Automatically measures container width to prevent overflow on mobile & web.
export default function ChartWidget({
  widget,
  forceColor,
}: {
  widget: ChartWidgetT;
  forceColor?: string;
}) {
  const { colors, isDark } = useApp();
  const { width: winWidth } = useWindowDimensions();
  const [containerW, setContainerW] = useState(0);

  // Palette: Chlorophyll -> mint-green, Wave -> azure, SST -> coral/rose, Wind -> gold
  const lineColor =
    forceColor ||
    (/chloro/i.test(widget.title)
      ? colors.success
      : /sst|temp/i.test(widget.title)
      ? "#FF5B6E"
      : /wave/i.test(widget.title)
      ? "#38BDF8"
      : colors.dataBlue);

  // Measure card inner width; fallback to mobile-safe width
  const baseW = containerW > 0 ? containerW : Math.min(winWidth, 420) - spacing.md * 2;
  const W = Math.max(220, baseW);
  const H = 140;
  const padL = 32;
  const padB = 22;
  const padT = 12;
  const padR = 12;

  const { points, min, max, coords } = useMemo(() => {
    const vals = widget.values && widget.values.length > 0 ? widget.values : [0, 0];
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const range = mx - mn || 1;
    const innerW = Math.max(W - padL - padR, 50);
    const innerH = Math.max(H - padT - padB, 40);
    const cs = vals.map((v, i) => {
      const x = padL + (i / Math.max(vals.length - 1, 1)) * innerW;
      const y = padT + (1 - (v - mn) / range) * innerH;
      return { x, y, v };
    });
    return {
      points: cs.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" "),
      min: mn,
      max: mx,
      coords: cs,
    };
  }, [widget, W]);

  return (
    <View
      testID={`chart-${widget.title}`}
      style={[
        styles.wrap,
        {
          backgroundColor: isDark ? "rgba(24, 28, 32, 0.75)" : "rgba(255, 255, 255, 0.9)",
          borderColor: colors.borderGlass,
        },
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - containerW) > 5) {
          setContainerW(w - spacing.md * 2);
        }
      }}
    >
      <Text style={[styles.title, { color: colors.onSurface }]}>{widget.title.toUpperCase()}</Text>
      <Text style={[styles.unit, { color: colors.muted }]}>UNIT: {widget.unit}</Text>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "hidden" }}>
        {/* axes */}
        <Line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={H - padB}
          stroke={colors.border}
          strokeWidth={1.5}
        />
        <Line
          x1={padL}
          y1={H - padB}
          x2={W - padR}
          y2={H - padB}
          stroke={colors.border}
          strokeWidth={1.5}
        />
        {/* y labels */}
        <SvgText x={2} y={padT + 8} fontSize="9" fill={colors.onSurfaceTertiary}>
          {max.toFixed(1)}
        </SvgText>
        <SvgText x={2} y={H - padB} fontSize="9" fill={colors.onSurfaceTertiary}>
          {min.toFixed(1)}
        </SvgText>
        {/* line */}
        <Polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
        />
        {coords.map((c, i) => (
          <Circle key={i} cx={c.x} cy={c.y} r={3} fill={lineColor} />
        ))}
        {/* x labels (first / mid / last) */}
        {widget.labels &&
          [0, Math.floor(coords.length / 2), coords.length - 1].map((idx) => {
            if (!coords[idx] || !widget.labels[idx]) return null;
            return (
              <SvgText
                key={idx}
                x={coords[idx].x}
                y={H - padB + 14}
                fontSize="9"
                fill={colors.onSurfaceTertiary}
                textAnchor="middle"
              >
                {widget.labels[idx]}
              </SvgText>
            );
          })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceInverse,
    width: "100%",
    overflow: "hidden",
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: type.sm,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.onSurface,
  },
  unit: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
});
