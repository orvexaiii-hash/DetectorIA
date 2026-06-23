import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const C = {
  high:   { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   },
  medium: { color: '#F97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)'  },
  low:    { color: '#EAB308', bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.25)'   },
  safe:   { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)'  },
};

function StatCard({ value, label, color }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RiskBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.riskRow}>
      <View style={[styles.riskDot, { backgroundColor: color }]} />
      <Text style={styles.riskLabel}>{label}</Text>
      <View style={styles.riskTrack}>
        <View style={[styles.riskFill, { width: `${Math.max(pct, 0)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.riskCount, { color }]}>{count}</Text>
    </View>
  );
}

export default function DashboardScreen({ history }) {
  const stats = useMemo(() => {
    const done  = history.filter(h => h.status === 'done');
    const total = done.length;
    const high   = done.filter(h => h.risk === 'high').length;
    const medium = done.filter(h => h.risk === 'medium').length;
    const low    = done.filter(h => h.risk === 'low').length;
    const safe   = done.filter(h => h.risk === 'safe').length;
    const avgFake = total > 0 ? done.reduce((s, h) => s + (h.fake_probability || 0), 0) / total : 0;
    const suspicious = high + medium;

    let level = 'NINGUNA', cfg = C.safe, icon = '✓';
    if (high > 0)        { level = 'ALTA';     cfg = C.high;   icon = '⚠'; }
    else if (medium > 0) { level = 'MEDIA';    cfg = C.medium; icon = '!'; }
    else if (low > 0)    { level = 'BAJA';     cfg = C.low;    icon = '◎'; }

    return { total, high, medium, low, safe, avgFake, suspicious, level, cfg };
  }, [history]);

  const lastSeven = useMemo(() => {
    const days = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('es-AR', { weekday: 'short' });
      days[key] = { suspicious: 0, safe: 0 };
    }
    history.filter(h => h.status === 'done').forEach(h => {
      const key = new Date(h.timestamp).toLocaleDateString('es-AR', { weekday: 'short' });
      if (days[key]) {
        if (h.risk === 'high' || h.risk === 'medium') days[key].suspicious++;
        else days[key].safe++;
      }
    });
    return Object.entries(days);
  }, [history]);

  const maxDay = Math.max(...lastSeven.map(([, v]) => v.suspicious + v.safe), 1);
  const { cfg } = stats;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Resumen de actividad</Text>
      </View>

      {/* ─── Threat level ─── */}
      <View style={[styles.threatCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <View style={[styles.threatIconWrap, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.threatIcon, { color: cfg.color }]}>{stats.cfg === C.safe && stats.total === 0 ? '—' : (stats.level === 'ALTA' ? '⚠' : stats.level === 'MEDIA' ? '!' : stats.level === 'BAJA' ? '◎' : '✓')}</Text>
        </View>
        <View style={styles.threatBody}>
          <Text style={styles.threatLabel}>Nivel de amenaza</Text>
          <Text style={[styles.threatLevel, { color: cfg.color }]}>{stats.total === 0 ? 'SIN DATOS' : stats.level}</Text>
        </View>
        {stats.suspicious > 0 && (
          <View style={[styles.threatBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Text style={[styles.threatBadgeText, { color: cfg.color }]}>
              {stats.suspicious} alerta{stats.suspicious > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* ─── Stats 2×2 ─── */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard value={stats.total}                        label="Total analizados"  color="#6B89A8" />
          <StatCard value={stats.suspicious}                   label="Sospechosos"       color="#EF4444" />
        </View>
        <View style={styles.statsRow}>
          <StatCard value={stats.safe}                         label="Seguros"           color="#10B981" />
          <StatCard value={`${stats.avgFake.toFixed(0)}%`}    label="IA promedio"       color="#F97316" />
        </View>
      </View>

      {/* ─── Risk distribution ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distribución de riesgo</Text>
        <RiskBar label="Alto"   count={stats.high}   total={stats.total} color="#EF4444" />
        <RiskBar label="Medio"  count={stats.medium} total={stats.total} color="#F97316" />
        <RiskBar label="Bajo"   count={stats.low}    total={stats.total} color="#EAB308" />
        <RiskBar label="Seguro" count={stats.safe}   total={stats.total} color="#10B981" />
      </View>

      {/* ─── 7-day chart ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad · últimos 7 días</Text>
        {stats.total === 0 ? (
          <View style={styles.noData}>
            <Text style={styles.noDataText}>Sin datos todavía. Iniciá el monitoreo.</Text>
          </View>
        ) : (
          <View style={styles.chart}>
            {lastSeven.map(([day, val]) => {
              const total = val.suspicious + val.safe;
              const pct = total / maxDay;
              const color = val.suspicious > 0 ? '#EF4444' : total > 0 ? '#10B981' : '#1A2E46';
              return (
                <View key={day} style={styles.chartCol}>
                  <View style={styles.chartBarWrap}>
                    <View style={[styles.chartBar, {
                      height: Math.max(pct * 88, total > 0 ? 6 : 0),
                      backgroundColor: color,
                    }]} />
                  </View>
                  <Text style={styles.chartDay}>{day}</Text>
                  {total > 0 && <Text style={[styles.chartCount, { color }]}>{total}</Text>}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070B14' },

  header: {
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16,
  },
  title:    { fontSize: 26, fontWeight: '800', color: '#E8F0F8', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#4D6B88', marginTop: 2 },

  threatCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 16,
    borderRadius: 16, borderWidth: 1,
    padding: 16, gap: 14,
  },
  threatIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  threatIcon:  { fontSize: 22, fontWeight: '700' },
  threatBody:  { flex: 1 },
  threatLabel: { fontSize: 11, color: '#4D6B88', fontWeight: '500', marginBottom: 2 },
  threatLevel: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  threatBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  threatBadgeText: { fontSize: 12, fontWeight: '700' },

  statsGrid: { paddingHorizontal: 20, marginBottom: 12 },
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#0D1828',
    borderRadius: 14, borderWidth: 1, borderColor: '#1A2E46',
    padding: 14,
  },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#4D6B88', fontWeight: '500' },

  section: {
    backgroundColor: '#0D1828',
    borderRadius: 16, borderWidth: 1, borderColor: '#1A2E46',
    padding: 16, marginHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#4D6B88',
    letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 14,
  },

  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  riskDot:   { width: 8, height: 8, borderRadius: 4 },
  riskLabel: { width: 46, fontSize: 13, color: '#C8D8E8', fontWeight: '500' },
  riskTrack: { flex: 1, height: 6, backgroundColor: '#132135', borderRadius: 3 },
  riskFill:  { height: 6, borderRadius: 3 },
  riskCount: { width: 22, fontSize: 13, fontWeight: '700', textAlign: 'right' },

  noData: { paddingVertical: 24, alignItems: 'center' },
  noDataText: { fontSize: 13, color: '#2A3A50', textAlign: 'center' },

  chart: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', height: 128, paddingTop: 10,
  },
  chartCol:    { flex: 1, alignItems: 'center' },
  chartBarWrap: { height: 88, justifyContent: 'flex-end', width: '62%' },
  chartBar:    { width: '100%', borderRadius: 4 },
  chartDay:    { fontSize: 10, color: '#2A3A50', marginTop: 6, fontWeight: '500' },
  chartCount:  { fontSize: 10, fontWeight: '700', marginTop: 2 },
});
