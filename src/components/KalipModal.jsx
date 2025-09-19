// src/components/KalipModal.jsx
import React from 'react';

const KalipModal = ({ kalip, onClose }) => {
  if (!kalip) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{kalip.kalip}</h3>
        <p dangerouslySetInnerHTML={{ __html: kalip.aciklama.replace(/\n/g, '<br />') }} />
        <button onClick={onClose} style={{ marginTop: '1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
          Kapat
        </button>
      </div>
    </div>
  );
};

export default KalipModal;
