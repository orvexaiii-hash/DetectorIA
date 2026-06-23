import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, PermissionsAndroid, Platform, StatusBar as RNStatusBar,
  Animated, Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startMonitor, stopMonitor, findWhatsAppFolder } from '../monitor';
import { checkServerHealth } from '../api';
import { setupNotifications, notifyResult } from '../notifications';
import ResultCard from '../components/ResultCard';
import StatusIndicator from '../components/StatusBar';

const HISTORY_KEY = 'detectorIA_history';
const BTN = 104;
const WRAP = 220;

export default function HomeScreen({ history, setHistory }) {
  const [monitoring, setMonitoring] = useState(false);
  const [serverOk, setServerOk]       = useState(null);
  const [whatsappFound, setWhatsappFound] = useState(null);
  const [analyzing, setAnalyzing]     = useState(false);

  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadHistory();
    checkServer();
    checkWhatsApp();
    setupNotifications().catch(() => {});
  }, []);

  useEffect(() => {
    if (!monitoring) {
      ring1.setValue(0);
      ring2.setValue(0);
      return;
    }
    const runRing = (anim, delay) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      loop.start();
      return loop;
    };
    const l1 = runRing(ring1, 0);
    const l2 = runRing(ring2, 900);
    return () => { l1.stop(); l2.stop(); ring1.setValue(0); ring2.setValue(0); };
  }, [monitoring]);

  async function loadHistory() {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }

  async function saveHistory(h) {
    try { await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 100))); } catch {}
  }

  async function checkServer() {
    setServerOk(await checkServerHealth());
  }

  async function checkWhatsApp() {
    const path = await findWhatsAppFolder();
    setWhatsappFound(!!path);
  }

  async function requestPermissions() {
    if (Platform.OS !== 'android') return true;
    try {
      const grants = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ]);
      return Object.values(grants).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
    } catch { return false; }
  }

  const handleResult = useCallback((event) => {
    if (event.error) { Alert.alert('Error', event.error); return; }
    if (event.type === 'analyzing') { setAnalyzing(true); return; }
    if (event.type === 'result' || event.type === 'error') {
      setAnalyzing(false);
      if (event.type === 'result') notifyResult(event.entry).catch(() => {});
      setHistory(prev => {
        const updated = [event.entry, ...prev].slice(0, 100);
        saveHistory(updated);
        return updated;
      });
    }
  }, [setHistory]);

  async function toggleMonitor() {
    if (monitoring) { stopMonitor(); setMonitoring(false); return; }
    if (!serverOk) {
      Alert.alert('Servidor no disponible', 'Verificá tu conexión a internet. El servidor en la nube debería estar activo.');
      return;
    }
    const ok = await requestPermissions();
    if (!ok) {
      Alert.alert('Permisos necesarios', 'DetectorIA necesita acceso al almacenamiento para monitorear los audios.');
      return;
    }
    const started = await startMonitor(handleResult);
    if (started) setMonitoring(true);
    else Alert.alert('WhatsApp no encontrado', 'No se encontró la carpeta de audios de WhatsApp en este dispositivo.');
  }

  function clearHistory() {
    Alert.alert('Borrar historial', '¿Eliminar todos los análisis?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { setHistory([]); AsyncStorage.removeItem(HISTORY_KEY); } },
    ]);
  }

  const suspicious = history.filter(h => h.risk === 'high' || h.risk === 'medium').length;

  const ringStyle = (anim) => ({
    opacity: anim.interpolate({ inputRange: [0, 0.08, 1], outputRange: [0, 0.7, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.3] }) }],
  });

  return (
    <View style={styles.container}>
      <RNStatusBar backgroundColor="#070B14" barStyle="light-content" translucent={false} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>D</Text>
          </View>
          <View>
            <Text style={styles.appName}>DetectorIA</Text>
            <Text style={styles.appTagline}>Protección contra fraudes de voz</Text>
          </View>
        </View>
        <View style={[styles.chip, monitoring ? styles.chipActive : styles.chipIdle]}>
          <View style={[styles.chipDot, monitoring ? styles.chipDotActive : styles.chipDotIdle]} />
          <Text style={[styles.chipText, monitoring ? styles.chipTextActive : styles.chipTextIdle]}>
            {monitoring ? 'ACTIVO' : 'INACTIVO'}
          </Text>
        </View>
      </View>

      {/* ─── Status bar ─── */}
      <StatusIndicator serverOk={serverOk} whatsappFound={whatsappFound} analyzing={analyzing} />

      {/* ─── Alert banner ─── */}
      {suspicious > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertIcon}>⚠</Text>
          <Text style={styles.alertText}>
            {suspicious} audio{suspicious > 1 ? 's' : ''} sospechoso{suspicious > 1 ? 's' : ''} detectado{suspicious > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* ─── Monitor button ─── */}
      <View style={styles.monitorSection}>
        <View style={styles.monitorWrap}>
          <Animated.View style={[styles.ring, ringStyle(ring1)]} />
          <Animated.View style={[styles.ring, ringStyle(ring2)]} />
          <TouchableOpacity
            style={[styles.monitorBtn, monitoring ? styles.monitorBtnStop : styles.monitorBtnStart]}
            onPress={toggleMonitor}
            activeOpacity={0.82}>
            <Text style={styles.monitorIcon}>{monitoring ? '■' : '▶'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.monitorLabel}>
          {monitoring ? 'Toca para detener el monitoreo' : 'Toca para iniciar el monitoreo'}
        </Text>
        {monitoring && (
          <View style={styles.scanRow}>
            <View style={styles.scanDot} />
            <Text style={styles.scanText}>Escaneando WhatsApp Audio · cada 3 seg.</Text>
          </View>
        )}
      </View>

      {/* ─── History header ─── */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>
          {history.length === 0 ? 'Análisis recientes' : `Análisis recientes  ·  ${history.length}`}
        </Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.clearBtn}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── List / empty state ─── */}
      {history.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Text style={{ fontSize: 34 }}>🎙️</Text>
          </View>
          <Text style={styles.emptyTitle}>Sin análisis todavía</Text>
          <Text style={styles.emptyText}>
            Iniciá el monitoreo y DetectorIA analizará automáticamente los audios de WhatsApp que recibas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ResultCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070B14' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoMark: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  appName: { fontSize: 22, fontWeight: '800', color: '#E8F0F8', letterSpacing: -0.5 },
  appTagline: { fontSize: 11, color: '#4D6B88', marginTop: 1 },

  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  chipIdle:       { backgroundColor: 'rgba(45,62,82,0.25)', borderColor: '#1E3048' },
  chipActive:     { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
  chipDot:        { width: 6, height: 6, borderRadius: 3 },
  chipDotIdle:    { backgroundColor: '#2A3A50' },
  chipDotActive:  { backgroundColor: '#10B981' },
  chipText:       { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  chipTextIdle:   { color: '#3D5572' },
  chipTextActive: { color: '#10B981' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
  },
  alertIcon: { fontSize: 16, color: '#EF4444' },
  alertText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },

  monitorSection: { alignItems: 'center', paddingBottom: 20 },
  monitorWrap: {
    width: WRAP, height: WRAP,
    alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: BTN, height: BTN,
    borderRadius: BTN / 2,
    borderWidth: 2, borderColor: '#10B981',
    top: (WRAP - BTN) / 2, left: (WRAP - BTN) / 2,
  },
  monitorBtn: {
    width: BTN, height: BTN, borderRadius: BTN / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  monitorBtnStart: {
    backgroundColor: '#1D4ED8',
    borderWidth: 3, borderColor: '#3B82F6',
  },
  monitorBtnStop: {
    backgroundColor: '#7F1D1D',
    borderWidth: 3, borderColor: '#EF4444',
  },
  monitorIcon: { fontSize: 34, color: '#FFFFFF' },
  monitorLabel: { fontSize: 13, color: '#4D6B88', fontWeight: '500', marginTop: -12 },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  scanDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  scanText: { fontSize: 12, color: '#10B981', fontWeight: '500' },

  historyHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 10,
  },
  historyTitle: { fontSize: 12, fontWeight: '700', color: '#4D6B88', letterSpacing: 0.4, textTransform: 'uppercase' },
  clearBtn: { fontSize: 13, color: '#2A3A50', fontWeight: '500' },

  list: { paddingHorizontal: 20, paddingBottom: 100 },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingBottom: 80,
  },
  emptyIcon: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: '#0D1828',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1, borderColor: '#1A2E46',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#4D6B88', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#2A3A50', textAlign: 'center', lineHeight: 21 },
});
