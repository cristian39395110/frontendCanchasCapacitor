import React, { useEffect, useState } from 'react';
import { CapacitorHttp } from '@capacitor/core';
import { API_URL } from '../config';

const TestBackendPage: React.FC = () => {
  const [estado, setEstado] = useState('⏳ Conectando...');

  useEffect(() => {
    const fetchBackend = async () => {
      try {
        const res = await CapacitorHttp.get({
          url: `${API_URL}/api/usuarios/test`,
          headers: { 'Accept': 'text/plain' }
        });

        console.log('✅ Respuesta:', res);
        setEstado(`✅ Conexión por HTTP plugin: ${res.data}`);
      } catch (err: any) {
        console.error('❌ Capacitor HTTP error:', err);
        setEstado(`❌ Capacitor HTTP error: ${err.message || 'Sin mensaje'}`);
      }
    };

    fetchBackend();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>🧪 Test Backend</h1>
      <p>{estado}</p>
      <p>URL: {API_URL}/api/usuarios/test</p>
    </div>
  );
};

export default TestBackendPage;
