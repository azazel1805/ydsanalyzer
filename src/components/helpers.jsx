// src/components/helpers.jsx
import React from 'react';

export const renderWithClickableKalips = (text, kalips, onKalipClick) => {
  if (!text) return null;
  if (!kalips || kalips.length === 0) {
    return <p dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }} />;
  }
  const regex = new RegExp(`(${kalips.map(k => k.kalip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <p>
      {parts.map((part, index) => {
        const matchingKalip = kalips.find(k => k.kalip.toLowerCase() === part.toLowerCase());
        if (matchingKalip) {
          return <span key={index} className="clickable-kalip" onClick={() => onKalipClick(matchingKalip)}>{part}</span>;
        }
        return <span key={index} dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, '<br />') }} />;
      })}
    </p>
  );
};
