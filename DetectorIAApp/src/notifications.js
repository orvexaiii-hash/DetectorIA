import notifee, { AndroidImportance, AndroidColor } from '@notifee/react-native';

const CHANNEL_HIGH = 'detectorIA_high';
const CHANNEL_LOW = 'detectorIA_low';

export async function setupNotifications() {
  await notifee.createChannel({
    id: CHANNEL_HIGH,
    name: 'Alertas de IA - Alto Riesgo',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    lights: true,
    lightColor: AndroidColor.RED,
  });

  await notifee.createChannel({
    id: CHANNEL_LOW,
    name: 'Alertas de IA - Informativo',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

export async function notifyResult(entry) {
  const { risk, filename, fake_probability } = entry;

  const configs = {
    high: {
      channel: CHANNEL_HIGH,
      title: '🚨 ALERTA: Audio de IA detectado',
      color: '#E53E3E',
    },
    medium: {
      channel: CHANNEL_HIGH,
      title: '⚠️ Precaución: Posible audio de IA',
      color: '#DD6B20',
    },
    low: {
      channel: CHANNEL_LOW,
      title: 'ℹ️ Audio analizado',
      color: '#D69E2E',
    },
    safe: {
      channel: CHANNEL_LOW,
      title: '✅ Audio seguro',
      color: '#38A169',
    },
  };

  const config = configs[risk] || configs.safe;

  await notifee.displayNotification({
    title: config.title,
    body: `${filename} — Probabilidad IA: ${fake_probability?.toFixed(1)}%`,
    android: {
      channelId: config.channel,
      color: config.color,
      smallIcon: 'ic_notification',
      pressAction: { id: 'default' },
      style: {
        type: 'bigText',
        text: `Archivo: ${filename}\nProbabilidad de ser IA: ${fake_probability?.toFixed(1)}%\n${entry.verdict}`,
      },
    },
  });
}
