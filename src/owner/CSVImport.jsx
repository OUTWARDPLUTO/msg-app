import { useState, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, Spinner, Skeleton } from '../shared/primitives.jsx';
import { parseCSV, importMembersFromCSV } from '../shared/firebase.js';

const REQUIRED_FIELDS = ['name'];
const OPTIONAL_FIELDS = ['email', 'phone'];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

export default function CSVImport({ gymId, onBack }) {
  const fileRef = useRef();
  const [step, setStep]       = useState('upload'); // upload | map | validate | importing | done
  const [headers, setHeaders] = useState([]);
  const [rows, setRows]       = useState([]);
  const [mapping, setMapping] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors]   = useState([]);
  const [imported, setImported] = useState(0);
  const [loading, setLoading] = useState(false);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const { headers, rows } = parseCSV(ev.target.result);
      setHeaders(headers);
      setRows(rows);
      // Auto-detect mapping
      const auto = { name: '', email: '', phone: '' };
      headers.forEach(h => {
        const l = h.toLowerCase();
        if (!auto.name  && (l.includes('name') || l === 'member')) auto.name = h;
        if (!auto.email && l.includes('email')) auto.email = h;
        if (!auto.phone && (l.includes('phone') || l.includes('mobile') || l.includes('contact'))) auto.phone = h;
      });
      setMapping(auto);
      setStep('map');
    };
    reader.readAsText(file);
  }

  function validate() {
    const errs = [];
    const emails = new Set();
    rows.forEach((row, i) => {
      const name = mapping.name ? row[mapping.name]?.trim() : '';
      const email = mapping.email ? row[mapping.email]?.trim() : '';
      const phone = mapping.phone ? row[mapping.phone]?.trim() : '';

      if (!name) errs.push({ row: i + 2, field: 'name', msg: 'Missing name' });
      if (email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push({ row: i + 2, field: 'email', msg: 'Invalid email' });
        else if (emails.has(email)) errs.push({ row: i + 2, field: 'email', msg: 'Duplicate email' });
        else emails.add(email);
      }
    });
    setErrors(errs);
    setStep('validate');
  }

  async function doImport() {
    setStep('importing');
    const errorRows = new Set(errors.map(e => e.row - 2));
    const validRows = rows
      .filter((_, i) => !errorRows.has(i))
      .map(row => ({
        name:  (mapping.name ? row[mapping.name]?.trim() : '') || 'Unknown',
        email: mapping.email ? row[mapping.email]?.trim() : '',
        phone: mapping.phone ? row[mapping.phone]?.trim() : '',
      }));
    await importMembersFromCSV(gymId, validRows);
    setImported(validRows.length);
    setStep('done');
  }

  function reset() {
    setStep('upload'); setHeaders([]); setRows([]);
    setMapping({ name: '', email: '', phone: '' });
    setErrors([]); setImported(0);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div style={{ paddingBottom: 100, background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 700, color: C.text }}>Import CSV</div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* ── Step 1: Upload ──────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="msg-anim-fadein">
            <div style={{
              border: `2px dashed ${C.border}`, borderRadius: 20, padding: '40px 20px',
              textAlign: 'center', marginBottom: 20, background: C.s1,
              cursor: 'pointer', transition: 'all 0.2s ease',
            }} onClick={() => fileRef.current?.click()}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: `1px solid ${C.border}` }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </div>
              <div style={{ fontFamily: fb, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Upload CSV File
              </div>
              <div style={{ fontSize: 13, color: C.sub, fontFamily: fn }}>Tap to browse or drag & drop</div>
            </div>
            <input
              ref={fileRef} type="file" accept=".csv,text/csv"
              onChange={handleFile} style={{ display: 'none' }}
            />
            
            <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px' }}>
              <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16 }}>Format Requirements</div>
              {[
                { i: '1', t: 'First row must contain column headers' },
                { i: '2', t: 'Required fields: Name' },
                { i: '3', t: 'Optional: Email, Phone' },
                { i: '4', t: 'Export as basic CSV (no formatting)' },
              ].map(({ i, t }) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.bg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.sub, fontFamily: fb, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{i}</div>
                  <span style={{ fontSize: 14, color: C.text, fontFamily: fn, lineHeight: 1.4 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Map Columns ─────────────────────────────────── */}
        {step === 'map' && (
          <div className="msg-anim-fadein">
            <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: C.text, fontFamily: fb, marginBottom: 16, lineHeight: 1.5 }}>
                Found <span style={{ color: C.accent, fontWeight: 800 }}>{rows.length}</span> rows.<br/>
                <span style={{ color: C.sub, fontSize: 13, fontWeight: 500, fontFamily: fn }}>Map columns to MSG member fields.</span>
              </div>
              {ALL_FIELDS.map(field => (
                <div key={field} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{field}{REQUIRED_FIELDS.includes(field) ? ' *' : ''}</div>
                  <select
                    value={mapping[field]}
                    onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                    style={{
                      width: '100%', background: C.bg, border: `1px solid ${C.border}`,
                      borderRadius: 12, padding: '12px 14px', color: C.text,
                      fontSize: 14, fontFamily: fn, outline: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="">— Select Column —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12, marginLeft: 4 }}>Preview (First 3)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {rows.slice(0, 3).map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: C.text, fontFamily: fb, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[mapping.name] || '—'}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: C.sub, fontFamily: fn, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[mapping.email] || '—'}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: C.sub, fontFamily: fn, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[mapping.phone] || '—'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={reset} style={{ flex: 1, padding: '16px', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 14, color: C.text, fontFamily: fb, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={validate} disabled={!mapping.name} style={{
                flex: 2, padding: '16px',
                background: mapping.name ? C.accent : C.s1,
                color: mapping.name ? '#111' : C.sub,
                border: mapping.name ? 'none' : `1px solid ${C.border}`,
                borderRadius: 14, fontFamily: fb, fontWeight: 700, fontSize: 14,
                cursor: mapping.name ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease'
              }}>
                Validate Data
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Validate ────────────────────────────────────── */}
        {step === 'validate' && (
          <div className="msg-anim-fadein">
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: fb, fontSize: 32, fontWeight: 800, color: C.green, marginBottom: 4 }}>{rows.length - errors.length}</div>
                <div style={{ fontSize: 12, color: C.sub, fontFamily: fn }}>Valid Rows</div>
              </div>
              <div style={{ flex: 1, background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: fb, fontSize: 32, fontWeight: 800, color: errors.length > 0 ? C.red : C.sub, marginBottom: 4 }}>{errors.length}</div>
                <div style={{ fontSize: 12, color: C.sub, fontFamily: fn }}>Skip Errors</div>
              </div>
            </div>

            {errors.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: C.red, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12, marginLeft: 4 }}>Validation Errors</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {errors.slice(0, 10).map((e, i) => (
                    <div key={i} style={{ padding: '12px 14px', background: C.red + '15', border: `1px solid ${C.red}33`, borderRadius: 12, fontSize: 13, color: C.red, fontFamily: fn, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.bg, color: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: fb, flexShrink: 0 }}>{e.row}</div>
                      <div>
                        <span style={{ fontWeight: 700 }}>{e.field}</span> — {e.msg}
                      </div>
                    </div>
                  ))}
                  {errors.length > 10 && <div style={{ fontSize: 13, color: C.sub, textAlign: 'center', fontFamily: fn, padding: '8px 0' }}>+{errors.length - 10} more errors</div>}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep('map')} style={{ flex: 1, padding: '16px', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 14, color: C.text, fontFamily: fb, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Back</button>
              <button onClick={doImport} disabled={rows.length === errors.length} style={{
                flex: 2, padding: '16px',
                background: rows.length > errors.length ? C.accent : C.s1,
                color: rows.length > errors.length ? '#111' : C.sub,
                border: rows.length > errors.length ? 'none' : `1px solid ${C.border}`,
                borderRadius: 14, fontFamily: fb, fontWeight: 700, fontSize: 14,
                cursor: rows.length > errors.length ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease'
              }}>
                Import {rows.length - errors.length} Members
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Importing ───────────────────────────────────── */}
        {step === 'importing' && (
          <div style={{ padding: '20px 0' }} className="msg-anim-fadein">
            <div style={{ fontSize: 16, fontFamily: fb, color: C.text, textAlign: 'center', marginBottom: 24 }}>
              Importing {rows.length} members…
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                  <Skeleton circle width={32} height={32} stagger={i} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton width="60%" height={14} stagger={i} />
                    <Skeleton width="30%" height={10} stagger={i} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 5: Done ────────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }} className="msg-anim-fadein">
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.s1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: `1px solid ${C.border}` }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div style={{ fontFamily: fb, fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 12 }}>
              Import Complete
            </div>
            <div style={{ color: C.sub, fontSize: 15, fontFamily: fn, marginBottom: 32 }}>
              Successfully imported <strong style={{ color: C.accent }}>{imported}</strong> members.
            </div>
            <button onClick={reset} style={{
              width: '100%', padding: '16px', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16,
              color: C.text, fontFamily: fb, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s ease'
            }}>
              Import Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
