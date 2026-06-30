import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';

export default function RevenueDetail({ gymId, onBack, hideHeader }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data fetching since revenue engine doesn't fully exist yet
    setTimeout(() => {
      setData([]);
      setLoading(false);
    }, 600);
  }, [gymId]);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: fn }}>
      {/* Header */}
      {!hideHeader && (
        <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 700, color: C.text }}>Revenue Details</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: C.sub }}>Loading revenue data...</div>
      ) : data.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontFamily: fb, fontSize: 18, color: C.text, marginBottom: 8 }}>Not Enough Data</div>
          <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
            There isn't enough historical revenue data to generate charts for this gym yet. Check back later once members start paying.
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          {/* Charts would go here */}
        </div>
      )}
    </div>
  );
}
