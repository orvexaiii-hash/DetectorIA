import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RISK = {
  high:    { label: 'ALTO RIESGO',   color: '#EF4444', bg: 'rgba(239,68,68,0.09)',   border: 'rgba(239,68,68,0.25)',   icon: '⚠' },
  medium:  { label: 'RIESGO MEDIO',  color: '#F97316', bg: 'rgba(249,115,22,0.09)',  border: 'rgba(249,115,22,0.25)',  icon: '!' },
  low:     { label: 'RIESGO BAJO',   color: '#EAB308', bg: 'rgba(234,179,8,0.09)',   border: 'rgba(234,179,8,0.25)',   icon: '◎' },
  safe:    { label: 'SEGURO',        color: '#10B981', bg: 'rgba(16,185,129,0.09)',  border: 'rgba(16,185,129,0.25)',  icon: '✓' },
  unknown: { label: 'ANALIZANDO...', color: '#4D6B88', bg: 'rgba(77,107,136,0.09)', border: 'rgba(77,107,136,0.25)', icon: '◌' },
};

export default function ResultCard({ item }) {
  const risk = item.risk || (item.status === 'analyzing' ? 'unknown' : 'unknown');
  const cfg = RISK[risk] || RISK.unknown;
  const pct = item.fake_probability != null ? Math.round(item.fake_probability) : null;
  const time = new Date(item.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(item.timestamp).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

  return (
    <View style={[styles.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={[styles.badgeIcon, { color: cfg.color }]}>{cfg.icon}</Text>
          <Text style={[styles.badgeLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        {pct != null && (
          <Text style={[styles.percent, { color: cfg.color }]}>{pct}%</Text>
        )}
      </View>

      <Text style={styles.filename} numberOfLines={1}>{item.filename}</Text>
      <Text style={styles.time}>{date} · {time}</Text>

      {pct != null && (
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
        </View>
      )}

      {item.status === 'error' && (
        <Text style={styles.errorText}>No se pudo procesar el archivo</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  percent: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  filename: {
    fontSize: 13,
    color: '#C8D8E8',
    fontWeight: '500',
    marginBottom: 3,
  },
  time: {
    fontSize: 11,
    color: '#3D5572',
    marginBottom: 10,
  },
  barBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 2,
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
  },
});
