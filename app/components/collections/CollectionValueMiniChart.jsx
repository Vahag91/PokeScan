// components/collections/CollectionValueMiniChart.jsx
import React, { useContext, useMemo, useEffect, useState, useCallback } from "react";
import { View, StyleSheet, Text, Pressable, ActivityIndicator } from "react-native";
import RNFS from "react-native-fs";
import { Circle, LinearGradient, useFont, vec, Text as SKText } from "@shopify/react-native-skia";
import { Area, CartesianChart, Line, useChartPressState } from "victory-native";
import { useTranslation } from "react-i18next";
import { ThemeContext } from "../../context/ThemeContext";
import { useDerivedValue } from "react-native-reanimated";

const inter = require("../../assets/fonts/Lato-Regular.ttf");
const interBold = require("../../assets/fonts/Lato-Bold.ttf");

const RANGE_OPTIONS = [
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "1Y", days: 365 },
];

// ---------- Helpers ----------
const money = (v, { compact = false } = {}) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact ? "compact" : "standard",
  }).format(Number(v || 0));

// ---------- RNFS helpers ----------
const filePathFor = (id) => `${RNFS.DocumentDirectoryPath}/collection_history_${id}.json`;
const dateKeyUTC = (d = new Date()) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
async function readHistoryLocal(collectionId, { days = null } = {}) {
  try {
    const path = filePathFor(collectionId);
    const exists = await RNFS.exists(path);
    if (!exists) return [];
    const txt = await RNFS.readFile(path, "utf8");
    const parsed = JSON.parse(txt || "{}");
    let pts = Array.isArray(parsed.points) ? parsed.points : [];

    // sort ASC
    pts = pts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    // window by range
    if (days && Number.isFinite(days)) {
      const since = new Date();
      since.setUTCDate(since.getUTCDate() - days);
      const sinceKey = dateKeyUTC(since);
      pts = pts.filter((p) => p.date >= sinceKey);
    }
    return pts;
  } catch {
    return [];
  }
}

export default function CollectionValueMiniChart({
  collectionId,
  days: daysProp = 30,
  onChangeDays,
  title,
}) {
  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);

  // fonts
  const font = useFont(inter, 10);
  const chartFont = useFont(interBold, 16);
  const fontsReady = !!font && !!chartFont;

  // press state
  const { state, isActive } = useChartPressState({ x: 0, y: { highTmp: 0 } });

  // range
  const [daysUncontrolled, setDaysUncontrolled] = useState(daysProp || 30);
  const days = onChangeDays ? daysProp : daysUncontrolled;

  // data + loader
  const [rawPoints, setRawPoints] = useState([]); // [{date, totalValue, count?}]
  const [isLoading, setIsLoading] = useState(true);
  const MIN_SPINNER_MS = 200;

  const load = useCallback(async () => {
    if (!collectionId) return;
    const started = Date.now();
    setIsLoading(true);
    const rows = await readHistoryLocal(collectionId, { days });
    setRawPoints(rows || []);
    const wait = Math.max(0, MIN_SPINNER_MS - (Date.now() - started));
    setTimeout(() => setIsLoading(false), wait);
  }, [collectionId, days]);

  useEffect(() => { load(); }, [load]);

  // prepared points for chart path (x=ts, y=totalValue)
  const prepared = useMemo(() => {
    const points = (rawPoints || []).map((p, i) => {
      const ts = Date.parse(p?.date || "") || i;
      return { x: ts, highTmp: Number(p?.totalValue ?? 0) };
    });
    if (points.length === 1) {
      const single = points[0];
      return [
        { ...single, x: single.x - 86400000 },
        single,
        { ...single, x: single.x + 86400000 },
      ];
    }
    return points;
  }, [rawPoints]);

  // latest from real data (not padded)
  const latestValue = useMemo(() => {
    if (!rawPoints.length) return 0;
    return Number(rawPoints[rawPoints.length - 1].totalValue || 0);
  }, [rawPoints]);

  // ----- PROFIT (price-only) vs CHANGE -----
  const profitCalc = useMemo(() => {
    if (rawPoints.length < 2) return { canProfit: false, profitAbs: 0, base: 0 };
    let acc = 0;
    let usedPairs = 0;
    let base = null;

    for (let i = 1; i < rawPoints.length; i++) {
      const prev = rawPoints[i - 1];
      const cur = rawPoints[i];
      const dv = Number(cur.totalValue || 0) - Number(prev.totalValue || 0);

      const prevHas = typeof prev.count === "number";
      const curHas = typeof cur.count === "number";

      if (prevHas && curHas && cur.count === prev.count) {
        if (base == null) base = Number(prev.totalValue || 0);
        acc += dv;
        usedPairs++;
      }
    }

    if (base == null) base = Number(rawPoints[0].totalValue || 0);
    return { canProfit: usedPairs > 0, profitAbs: acc, base };
  }, [rawPoints]);

  const changeAbs = useMemo(() => {
    if (prepared.length < 2) return 0;
    return prepared[prepared.length - 1].highTmp - prepared[0].highTmp;
  }, [prepared]);

  const pillIsProfit = profitCalc.canProfit;
  const pillAbs = pillIsProfit ? profitCalc.profitAbs : changeAbs;
  const baseForPct = pillIsProfit ? profitCalc.base : prepared[0]?.highTmp;
  const pillPct = baseForPct > 0 ? (pillAbs / baseForPct) * 100 : 0;
  const isUp = pillAbs >= 0;

  // --------- X-axis labels ----------
  const fmt1M = useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }),
    []
  );
  const fmt3M = useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: "short" }),
    []
  );
  const fmt1Y = useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: "short", year: "2-digit" }),
    []
  );
  const xLabelFormatter = useCallback((ts) => {
    const d = new Date(Number(ts));
    
    // For small datasets, show day and month
    if (prepared.length <= 7) {
      return new Intl.DateTimeFormat(undefined, { 
        day: "numeric", 
        month: "short" 
      }).format(d);
    }
    
    // For larger datasets, use the original logic
    if (days <= 30) return fmt1M.format(d);
    if (days <= 90) return fmt3M.format(d);
    return fmt1Y.format(d);
  }, [days, fmt1M, fmt3M, fmt1Y, prepared.length]);
  
  // Generate unique tick positions to avoid duplicates
  const getUniqueTicks = useCallback(() => {
    if (prepared.length <= 3) {
      // For small datasets, use all data points
      return prepared.map((_, index) => index);
    } else {
      // For larger datasets, sample evenly
      const step = Math.max(1, Math.floor(prepared.length / 6));
      const ticks = [];
      for (let i = 0; i < prepared.length; i += step) {
        ticks.push(i);
      }
      return ticks;
    }
  }, [prepared.length]);
  
  const xTickCount = getUniqueTicks().length;

  // theming / state
  const primaryColor = "#10B981";
  const gradientColor = theme?.background === "#0F172A" ? primaryColor + "15" : primaryColor + "08";
  const hasData = prepared.length > 0;
  const ready = !!font && !!chartFont && !isLoading;

  // === Live label as a DERIVED value (must avoid Intl/JS helpers in worklets) ===
  const hoverLabel = useDerivedValue(() => {
    "worklet";
    const v = state?.y?.highTmp?.value?.value;
    if (typeof v === "number" && !Number.isNaN(v)) {
      return "$" + v.toFixed(2); // simple, worklet-safe formatting
    }
    return "";
  }, [state]);

  return (
    <View style={getStyles(theme).sectionBox}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>
            {title || t('collections.detail.collectionValue', 'Collection Value')}
          </Text>

          {/* Profit/Change pill */}
          {hasData ? (
            <View
              style={[
                styles.deltaPill,
                {
                  backgroundColor: isUp ? "#16A34A20" : "#DC262620",
                  borderColor: isUp ? "#16A34A" : "#DC2626",
                },
              ]}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: isUp ? "#16A34A" : "#DC2626" }}>
                {(pillIsProfit ? "Profit" : "Change")} {isUp ? "▲" : "▼"} {money(Math.abs(pillAbs), { compact: true })} ({Math.abs(pillPct).toFixed(1)}%)
              </Text>
            </View>
          ) : null}
        </View>

        {/* Range */}
        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((opt) => {
            const active = days === opt.days;
            return (
              <Pressable
                key={opt.key}
                onPress={() => (onChangeDays ? onChangeDays(opt.days) : setDaysUncontrolled(opt.days))}
                style={[styles.rangeBtn, { backgroundColor: active ? primaryColor : "transparent" }]}
              >
                <Text style={[styles.rangeText, { color: active ? "#fff" : theme.mutedText }]}>
                  {t(`cards.timeRanges.${opt.key}`, opt.key)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Chart / Loader */}
      <View style={styles.chartContainer}>
        {!ready ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" />
            <Text style={{ color: theme.mutedText, marginTop: 6 }}>
              {t('common.loading', 'Loading…')}
            </Text>
          </View>
        ) : !hasData ? (
          <View style={styles.emptyWrap}>
            <Text style={{ color: theme.mutedText }}>
              {t('collections.detail.notEnoughData', 'Not enough data yet')}
            </Text>
          </View>
        ) : (
          <CartesianChart
            data={prepared}
            xKey="x"
            yKeys={["highTmp"]}
            domainPadding={{ top: 20, bottom: 20, left: 0, right: 0 }}
            axisOptions={{
              font,
              labelColor: theme.mutedText,
              lineColor: theme.border,
              formatXLabel: xLabelFormatter,
              formatYLabel: (v) => money(v, { compact: true }),
              tickCount: xTickCount,
            }}
            chartPressState={state}
          >
            {({ points, chartBounds }) => {
              const seriesPts = points?.highTmp || [];
              return (
                <>
                  {/* top-left label: static latest when idle, live derived while dragging */}
                  {chartFont && !isActive ? (
                    <SKText
                      x={chartBounds.left + 6}
                      y={16}
                      font={chartFont}
                      text={money(latestValue)}
                      color={primaryColor}
                      style={"fill"}
                    />
                  ) : null}

                  {chartFont && isActive ? (
                    <SKText
                      x={chartBounds.left + 6}
                      y={16}
                      font={chartFont}
                      text={hoverLabel} // derivedValue updates each frame
                      color={primaryColor}
                      style={"fill"}
                    />
                  ) : null}

                  {seriesPts.length > 0 && (
                    <Area points={seriesPts} y0={chartBounds.bottom}>
                      <LinearGradient
                        start={vec(0, chartBounds.top)}
                        end={vec(0, chartBounds.bottom)}
                        colors={[primaryColor + "15", gradientColor]}
                      />
                    </Area>
                  )}
                  {seriesPts.length > 0 && (
                    <Line points={seriesPts} color={primaryColor} strokeWidth={2} />
                  )}

                  {isActive && state?.x && state?.y?.highTmp ? (
                    <>
                      <Circle cx={state.x.position} cy={state.y.highTmp.position} r={8} color={primaryColor} opacity={0.2} />
                      <Circle cx={state.x.position} cy={state.y.highTmp.position} r={5} color={primaryColor} opacity={0.85} />
                      <Circle cx={state.x.position} cy={state.y.highTmp.position} r={2} color="white" opacity={1} />
                    </>
                  ) : null}
                </>
              );
            }}
          </CartesianChart>
        )}
      </View>
    </View>
  );
}

function getStyles(theme) {
  return StyleSheet.create({
    sectionBox: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
  });
}

const styles = StyleSheet.create({
  header: { marginBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  title: { fontSize: 14, fontWeight: "600", letterSpacing: -0.3 },
  deltaPill: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1 },
  rangeRow: { flexDirection: "row", gap: 6 },
  rangeBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  rangeText: { fontSize: 11, fontWeight: "600" },
  chartContainer: { height: 120, width: "100%", overflow: "hidden" },
  loadingWrap: { height: 120, alignItems: "center", justifyContent: "center" },
  emptyWrap: { flex: 1, height: 120, alignItems: "center", justifyContent: "center" },
});
