// src/pages/ChatPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ChatPage: React.FC = () => {
  const { usuarioId } = useParams();

  return (
    <div>
      <Navbar />
      <h2 style={{ textAlign: 'center', marginTop: '20px' }}>
        Chat con usuario ID: {usuarioId}
      </h2>
      {/* Acá va la lógica del chat */}
    </div>
  );
};

export default ChatPage;
