import React, { useContext, useMemo, useRef, useEffect, useState } from "react";
import { View, StyleSheet, Text, Animated, Pressable } from "react-native";
import {
  Circle,
  LinearGradient,
  useFont,
  vec,
  Text as SKText,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";
import { Area, CartesianChart, Line, useChartPressState } from "victory-native";
import { ThemeContext } from "../../context/ThemeContext";

const inter = require("../../assets/fonts/Lato-Regular.ttf");
const interBold = require("../../assets/fonts/Lato-Bold.ttf");

const RANGE_OPTIONS = [
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "6M", days: 180 },
  { key: "1Y", days: 365 },
];

export default function LineChart({
  data = [],                               // [{ highTmp, date }]
  series = null,                           // { series_key, series_label }
  days: daysProp = 90,                     // controlled current range (days)
  onChangeDays,                            // controlled setter (if provided)
}) {
  const { theme } = useContext(ThemeContext);
  const font = useFont(inter, 10);
  const chartFont = useFont(interBold, 20);
  const { state, isActive } = useChartPressState({ x: 0, y: { highTmp: 0 } });

  // Uncontrolled fallback if parent didn't pass onChangeDays
  const [daysUncontrolled, setDaysUncontrolled] = useState(daysProp || 90);
  const days = onChangeDays ? daysProp : daysUncontrolled;

  // ===== pretty series label (dedupe trailing tokens + split) =====
  const prettySeries = useMemo(() => {
    const raw = (series?.series_label || series?.series_key || "").replace(/[_]+/g, " ").trim();
    if (!raw) return null;

    const variants = [
      "1st edition holofoil",
      "reverse holofoil",
      "1st edition",
      "holofoil",
      "normal",
      "unlimited",
    ];

    const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();

    let s = raw.replace(/\s+/g, " ").trim();

    // collapse “… <variant> <variant>” to “… <variant>”
    for (const v of variants.sort((a,b)=>b.length-a.length)) {
      const reDup = new RegExp(`${v.replace(" ", "\\s+")}\\s+${v.replace(" ", "\\s+")}$`, "i");
      if (reDup.test(s)) {
        s = s.replace(reDup, v);
        break;
      }
    }

    // find trailing variant phrase
    let found = null;
    for (const v of variants.sort((a,b)=>b.length-a.length)) {
      const reEnd = new RegExp(`${v.replace(" ", "\\s+")}$`, "i");
      if (reEnd.test(s)) { found = v; break; }
    }

    if (!found) return titleCase(s);

    // strip the trailing variant (once)
    const reEndOnce = new RegExp(`\\s*${found.replace(" ", "\\s+")}\\s*$`, "i");
    let left = s.replace(reEndOnce, "").trim();

    // if left still ends with the same variant (duplicate earlier), remove again
    const reEndAgain = new RegExp(`\\s*${found.replace(" ", "\\s+")}\\s*$`, "i");
    left = left.replace(reEndAgain, "").trim();

    const variantLabel = titleCase(found);
    if (!left) return variantLabel;

    if (norm(left).endsWith(norm(found))) return titleCase(left);

    return `${titleCase(left)} — ${variantLabel}`;
  }, [series?.series_label, series?.series_key]);

  // ===== data prep (use real dates for X) =====
  const prepared = useMemo(() => {
    return (data || []).map((d, i) => {
      const ts = Date.parse(d?.date || "") || i;
      return { x: ts, highTmp: Number(d?.highTmp ?? 0) };
    });
  }, [data]);

  const dtFmt = useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" }),
    []
  );

  // ===== initial appear animation =====
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  // ===== tiny "switching" window to keep UI in sync during range changes =====
  const [switching, setSwitching] = useState(false);
  const switchTimer = useRef(null);
  useEffect(() => {
    if (!Array.isArray(data)) return;
    if (switchTimer.current) clearTimeout(switchTimer.current);
    setSwitching(true);
    switchTimer.current = setTimeout(() => setSwitching(false), 150);
    return () => clearTimeout(switchTimer.current);
  }, [data]);

  // ===== hover value =====
  const value = useDerivedValue(() => {
    const v = state?.y?.highTmp?.value?.value;
    if (typeof v !== "number" || Number.isNaN(v)) return "$0.00";
    return "$" + v.toFixed(2);
  }, [state]);

  // ===== theme =====
  const labelColor = theme.mutedText;
  const lineColor = theme.border;
  const primaryColor = "#00C853";
  const gradientColor = theme.background === "#0F172A" ? "#00C85315" : "#00C85308";

  const hasData = prepared.length > 0;

  // label for current range
  const rangeLabel =
    days === 30 ? "Last 1 month"
    : days === 90 ? "Last 3 months"
    : days === 180 ? "Last 6 months"
    : days === 365 ? "Last 1 year"
    : `Last ${days} days`;

  // handle range change
  const handlePick = (d) => {
    if (onChangeDays) onChangeDays(d);
    else setDaysUncontrolled(d);
  };

  return (
    <Animated.View
      style={[
        getStyles(theme).sectionBox,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>Price History</Text>
          <View style={[styles.statusIndicator, { backgroundColor: primaryColor }]} />
        </View>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          {rangeLabel}{prettySeries ? ` • ${prettySeries}` : ""}
        </Text>

        {/* Range switcher */}
        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map(opt => {
            const active = days === opt.days;
            return (
              <Pressable
                key={opt.key}
                onPress={() => handlePick(opt.days)}
                style={[
                  styles.rangeBtn,
                  { borderColor: theme.border, backgroundColor: active ? primaryColor : "transparent" },
                ]}
              >
                <Text style={[styles.rangeText, { color: active ? "#fff" : theme.text }]}>
                  {opt.key}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer} pointerEvents={switching ? "none" : "auto"}>
        {!hasData ? (
          <View style={styles.emptyWrap}>
            <Text style={{ color: theme.mutedText }}>No price data</Text>
          </View>
        ) : (
          <CartesianChart
            data={prepared}
            xKey="x"
            yKeys={["highTmp"]}
            domainPadding={{ top: 40, bottom: 40, left: 0, right: 0 }}
            axisOptions={{
              font,
              labelColor,
              lineColor,
              formatXLabel: (ts) => dtFmt.format(new Date(Number(ts))),
              formatYLabel: (v) => `$${Math.round(Number(v))}`,
              tickCount: 4,
            }}
            chartPressState={state}
          >
            {({ points, chartBounds }) => {
              const seriesPts = points?.highTmp || [];
              return (
                <>
                  {chartFont && isActive && !switching ? (
                    <SKText
                      x={chartBounds.left + 8}
                      y={24}
                      font={chartFont}
                      text={value}
                      color={primaryColor}
                      style={"fill"}
                    />
                  ) : null}

                  {seriesPts.length > 0 && (
                    <Area
                      points={seriesPts}
                      y0={chartBounds.bottom}
                      animate={switching ? undefined : { type: "timing", duration: 400 }}
                    >
                      <LinearGradient
                        start={vec(0, chartBounds.top)}
                        end={vec(0, chartBounds.bottom)}
                        colors={[primaryColor + "15", gradientColor]}
                      />
                    </Area>
                  )}

                  {seriesPts.length > 0 && (
                    <Line
                      points={seriesPts}
                      color={primaryColor}
                      strokeWidth={2.5}
                      animate={switching ? undefined : { type: "timing", duration: 400 }}
                    />
                  )}

                  {!switching && isActive && state?.x && state?.y?.highTmp ? (
                    <ToolTip x={state.x.position} y={state.y.highTmp.position} color={primaryColor} />
                  ) : null}
                </>
              );
            }}
          </CartesianChart>
        )}
      </View>
    </Animated.View>
  );
}

function ToolTip({ x, y, color = "#00C853" }) {
  return (
    <>
      <Circle cx={x} cy={y} r={8} color={color} opacity={0.2} />
      <Circle cx={x} cy={y} r={5} color={color} opacity={0.8} />
      <Circle cx={x} cy={y} r={2} color="white" opacity={1} />
    </>
  );
}

function titleCase(s) {
  return s.replace(/\b([a-z])/gi, (m) => m.toUpperCase());
}

const getStyles = (theme) =>
  StyleSheet.create({
    sectionBox: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
  });

const styles = StyleSheet.create({
  header: { marginBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "600", marginRight: 8, letterSpacing: -0.3 },
  statusIndicator: { width: 6, height: 6, borderRadius: 3, opacity: 0.9 },
  subtitle: { fontSize: 14, fontWeight: "400", opacity: 0.8 },

  rangeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  rangeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  rangeText: { fontSize: 12, fontWeight: "600" },

  chartContainer: { height: 180, width: "100%", overflow: "hidden" },
  emptyWrap: { flex: 1, height: 180, alignItems: "center", justifyContent: "center" },
});
