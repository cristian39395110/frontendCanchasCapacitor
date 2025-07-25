export const reproducirSonido = () => {
  const audio = new Audio('/sonidos/notifi.mp3');
  audio.play().catch(e => {
    console.warn('🔇 Sonido bloqueado por el navegador o WebView de Android:', e);
  });
};
