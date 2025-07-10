// components/GameCard.tsx
import '../utils/DashboardPage.css';
import React from 'react';

interface Props {
  title: string;
  image: string;
  onSelect: () => void;
}

const GameCard: React.FC<Props> = ({ title, image, onSelect }) => {
  return (
    <div className="game-card" onClick={onSelect}>
      <img src={image} alt={title} className="game-card-image" />
      <div className="game-card-title">{title}</div>
    </div>
  );
};

export default GameCard;
