import { FCM } from '@capacitor-community/fcm';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Solicita permisos, registra el dispositivo y obtiene el token FCM real.
 */
export async function getDeviceToken(): Promise<string | null> {
  try {
    console.log('🔔 Solicitando permiso de notificaciones...');
    const permissionStatus = await PushNotifications.requestPermissions();

    console.log('📊 Estado de permisos:', permissionStatus);

    if (permissionStatus.receive !== 'granted') {
      console.warn('❌ El usuario no concedió el permiso para notificaciones.');
      return null;
    }

    console.log('📲 Registrando dispositivo...');
    await PushNotifications.register();

    console.log('🎫 Obteniendo token FCM...');
    const { token } = await FCM.getToken();

    if (token) {
      console.log('✅ Token FCM obtenido:', token);
      return token;
    } else {
      console.warn('⚠️ No se obtuvo token FCM.');
      return null;
    }

  } catch (error) {
    console.error('❌ Error crítico al obtener token FCM:', error);
    return null;
  }
}

/**
 * Listener para cuando se recibe una notificación en primer o segundo plano.
 */
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('📩 Notificación recibida (foreground):', notification);
  alert(`${notification.title}\n${notification.body}`);
});
