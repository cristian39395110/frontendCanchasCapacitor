import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RutaProtegidaSoloAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [autorizado, setAutorizado] = useState<boolean | null>(null); // null = validando

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.id === 11) {
        setAutorizado(true);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  if (autorizado === null) {
    return <p style={{ textAlign: 'center', marginTop: '100px' }}>Verificando acceso...</p>;
  }

  return <>{children}</>;
};

export default RutaProtegidaSoloAdmin;
