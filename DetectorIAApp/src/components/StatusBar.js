import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

function StatusItem({ label, ok, loading }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse.setValue(1);
    }
  }, [loading]);

  const color = loading ? '#F59E0B' : ok === null ? '#2A3A50' : ok ? '#10B981' : '#EF4444';
  const statusText = loading ? 'Procesando' : ok === null ? 'Verificando' : ok ? 'Activo' : 'Error';

  return (
    <View style={styles.item}>
      <Animated.View style={[styles.dot, { backgroundColor: color, opacity: pulse }]} />
      <View>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={[styles.itemStatus, { color }]}>{statusText}</Text>
      </View>
    </View>
  );
}

export default function StatusBar({ serverOk, whatsappFound, analyzing }) {
  return (
    <View style={styles.container}>
      <StatusItem label="Servidor" ok={serverOk} loading={false} />
      <View style={styles.divider} />
      <StatusItem label="WhatsApp" ok={whatsappFound} loading={false} />
      <View style={styles.divider} />
      <StatusItem label="Escaneo" ok={!analyzing} loading={analyzing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#0D1828',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#1A2E46',
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#1A2E46',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemLabel: {
    fontSize: 11,
    color: '#4D6B88',
    fontWeight: '500',
  },
  itemStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
});
