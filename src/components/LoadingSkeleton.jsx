// src/components/LoadingSkeleton.jsx
import React from 'react';

const LoadingSkeleton = () => (
    <div className="analysis-result">
        <div className="result-section">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text"></div>
        </div>
        <div className="result-section">
            <div className="skeleton skeleton-title" style={{width: '60%'}}></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text-short"></div>
        </div>
        <div className="result-section">
            <div className="skeleton skeleton-title" style={{width: '50%'}}></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text"></div>
        </div>
    </div>
);

export default LoadingSkeleton;
