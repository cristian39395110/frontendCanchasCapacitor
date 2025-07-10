// utils/notificaciones.ts
import { getDeviceToken } from './fcm';
import { API_URL } from '../config';

import { Toast } from '@capacitor/toast';

export const suscribirseANotificaciones = async (usuarioId: number) => {
  try {
    await Toast.show({ text: '🛎️ Obteniendo token FCM...' });
    const token = await getDeviceToken();

    if (!token) {
      await Toast.show({ text: '❌ No se pudo obtener token FCM' });
      console.error('❌ Token no obtenido');
      return;
    }

    await Toast.show({ text: '📡 Enviando token al servidor...' });

    const res = await fetch(`${API_URL}/api/suscripcion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, fcmToken: token }),
    });

    if (res.ok) {
      await Toast.show({ text: '✅ Suscripción exitosa' });
      console.log('✅ Token enviado correctamente');
    } else {
      await Toast.show({ text: '⚠️ Error al suscribirse en el servidor' });
      console.error('❌ Error en respuesta del servidor:', await res.text());
    }
  } catch (err) {
    console.error('❌ Error al suscribirse:', err);
    await Toast.show({ text: '💥 Error crítico en suscripción' });
  }
};
export const desuscribirseANotificaciones = async (usuarioId: number) => {
  try {
    await fetch(`${API_URL}/api/suscripcion/usuario/${usuarioId}`, {
      method: 'DELETE',
    });

    console.log('🗑️ Token eliminado del backend');
  } catch (err) {
    console.error('❌ Error al eliminar suscripción:', err);
  }
};
