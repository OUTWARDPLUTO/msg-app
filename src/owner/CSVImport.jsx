import { useState, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, Spinner } from '../shared/primitives.jsx';
import { parseCSV, importMembersFromCSV } from '../shared/firebase.js';

const REQUIRED_FIELDS = ['name'];
const OPTIONAL_FIELDS = ['email', 'phone'];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

export default function CSVImport({ gymId }) {
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
      const name = row[mapping.name]?.trim();
      const email = row[mapping.email]?.trim();
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
        name:  row[mapping.name]?.trim() || 'Unknown',
        email: row[mapping.email]?.trim() || '',
        phone: row[mapping.phone]?.trim() || '',
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
    <div style={{ paddingBottom: 32 }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
          CSV Import
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Bulk import members from a spreadsheet</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* ── Step 1: Upload ──────────────────────────────────────── */}
        {step === 'upload' && (
          <>
            <div style={{
              border: `2px dashed ${C.accent}44`, borderRadius: 16, padding: '36px 20px',
              textAlign: 'center', marginBottom: 16, background: C.accentD,
              cursor: 'pointer',
            }} onClick={() => fileRef.current?.click()}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📤</div>
              <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 700, color: C.accent, marginBottom: 6 }}>
                Click to upload your CSV
              </div>
              <div style={{ fontSize: 12, color: C.sub }}>or drag & drop your file here</div>
            </div>
            <input
              ref={fileRef} type="file" accept=".csv,text/csv"
              onChange={handleFile} style={{ display: 'none' }}
            />
            <Card style={{ padding: '14px 16px' }}>
              <Lbl text="CSV Format Tips" style={{ marginBottom: 10 }} />
              {[
                ['✅', 'First row must be column headers'],
                ['✅', 'Include: name, email, phone columns'],
                ['✅', 'Exported from Excel / Google Sheets'],
                ['❌', 'No merged cells or extra formatting'],
              ].map(([ic, t]) => (
                <div key={t} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 13 }}>{ic}</span>
                  <span style={{ fontSize: 12, color: C.sub }}>{t}</span>
                </div>
              ))}
            </Card>
          </>
        )}

        {/* ── Step 2: Map Columns ─────────────────────────────────── */}
        {step === 'map' && (
          <>
            <Card style={{ padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 12 }}>
                <span style={{ color: C.accent, fontWeight: 700 }}>{rows.length}</span> rows found.
                Map your CSV columns to member fields.
              </div>
              {ALL_FIELDS.map(field => (
                <div key={field} style={{ marginBottom: 12 }}>
                  <Lbl text={`${field}${REQUIRED_FIELDS.includes(field) ? ' *' : ''}`} style={{ marginBottom: 6 }} />
                  <select
                    value={mapping[field]}
                    onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                    style={{
                      width: '100%', background: C.s3, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: '10px 12px', color: C.text,
                      fontSize: 13, fontFamily: fn, outline: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="">— Not mapped —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </Card>

            {/* Preview */}
            <div style={{ fontFamily: fn, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Preview (first 3 rows)</div>
            {rows.slice(0, 3).map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.text, fontWeight: 600, flex: 1 }}>{row[mapping.name] || '—'}</span>
                <span style={{ fontSize: 11, color: C.muted, flex: 1 }}>{row[mapping.email] || '—'}</span>
                <span style={{ fontSize: 11, color: C.muted, flex: 1 }}>{row[mapping.phone] || '—'}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={reset} style={{ flex: 1, padding: '12px', background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, color: C.sub, fontFamily: fn, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← Back</button>
              <button onClick={validate} disabled={!mapping.name} style={{
                flex: 2, padding: '12px',
                background: mapping.name ? C.accent : C.s4,
                color: mapping.name ? '#111' : C.muted,
                border: 'none', borderRadius: 12, fontFamily: fn, fontWeight: 800, fontSize: 13,
                cursor: mapping.name ? 'pointer' : 'not-allowed',
              }}>
                Validate Data →
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Validate ────────────────────────────────────── */}
        {step === 'validate' && (
          <>
            <Card style={{ padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: fn, fontSize: 28, fontWeight: 800, color: C.green }}>{rows.length - errors.length}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>Valid rows</div>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontFamily: fn, fontSize: 28, fontWeight: 800, color: errors.length > 0 ? C.red : C.green }}>{errors.length}</div>
                  <div style={{ fontSize: 11, color: C.sub }}>Errors (will skip)</div>
                </div>
              </div>
            </Card>

            {errors.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <Lbl text="Validation Errors (these rows will be skipped)" style={{ marginBottom: 8 }} />
                {errors.slice(0, 10).map((e, i) => (
                  <div key={i} style={{ padding: '7px 10px', background: C.red + '10', border: `1px solid ${C.red}22`, borderRadius: 8, marginBottom: 5, fontSize: 12, color: C.red }}>
                    Row {e.row}: {e.field} — {e.msg}
                  </div>
                ))}
                {errors.length > 10 && <div style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>+{errors.length - 10} more errors</div>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={() => setStep('map')} style={{ flex: 1, padding: '12px', background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, color: C.sub, fontFamily: fn, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>← Back</button>
              <button onClick={doImport} disabled={rows.length === errors.length} style={{
                flex: 2, padding: '12px',
                background: rows.length > errors.length ? C.accent : C.s4,
                color: rows.length > errors.length ? '#111' : C.muted,
                border: 'none', borderRadius: 12, fontFamily: fn, fontWeight: 800, fontSize: 13,
                cursor: rows.length > errors.length ? 'pointer' : 'not-allowed',
              }}>
                Import {rows.length - errors.length} Members →
              </button>
            </div>
          </>
        )}

        {/* ── Step 4: Importing ───────────────────────────────────── */}
        {step === 'importing' && <Spinner text={`Importing ${rows.length} members…`} />}

        {/* ── Step 5: Done ────────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
            <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.green, marginBottom: 8 }}>
              Import Complete!
            </div>
            <div style={{ color: C.sub, fontSize: 14, marginBottom: 28 }}>
              Successfully imported <strong style={{ color: C.accent }}>{imported}</strong> members.
            </div>
            <button onClick={reset} style={{
              padding: '14px 32px', background: C.accent, border: 'none', borderRadius: 14,
              color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}>
              Import More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
