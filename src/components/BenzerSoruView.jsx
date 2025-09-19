// src/components/BenzerSoruView.jsx
import React from 'react';

const BenzerSoruView = ({ soru }) => {
  return (
    <div className="analysis-result" style={{ borderTop: '2px solid var(--success-color)' }}>
      <div className="multi-analysis-item" style={{ borderColor: 'var(--success-color)' }}>
        <h4>💡 Üretilen Benzer Soru</h4>
        <div className='result-section'>
          <h5>Soru Metni</h5>
          <p>{soru.yeniSoru}</p>
          <ul>
            {soru.secenekler.map((secenek, index) => (
              <li key={index}>{secenek}</li>
            ))}
          </ul>
        </div>
        <div className='result-section'>
          <h5>Doğru Cevap ve Açıklama</h5>
          <p><strong>{soru.dogruCevap}</strong></p>
          <p>{soru.kisaAciklama}</p>
        </div>
      </div>
    </div>
  );
};

export default BenzerSoruView;
