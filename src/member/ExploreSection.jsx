import { useState } from 'react';
import { C, fn, fb, MC } from '../shared/theme.js';
import { AnatomicalFigure } from '../AnatomicalFigure.jsx';
import { ExCard } from './primitives.jsx';
import { EX } from './constants.js';

// ─── Explore Section (Muscle Map) ───────────────────────────────────────────
export function ExploreSection() {
  const [muscle, setMuscle] = useState('chest');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('front');
  const [exploreSearch, setExploreSearch] = useState('');

  const mainGroups = [
    { id: 'chest', label: 'Chest', subs: ['chest'] },
    { id: 'back', label: 'Back', subs: ['traps', 'lats', 'lower_back'] },
    { id: 'shoulders', label: 'Shoulders', subs: ['shoulders', 'front-delt', 'lateral-delt', 'rear-delt'] },
    { id: 'arms', label: 'Arms', subs: ['biceps', 'triceps', 'forearms'] },
    { id: 'core', label: 'Core', subs: ['abs', 'obliques'] },
    { id: 'legs', label: 'Legs', subs: ['quads', 'hamstrings', 'glutes', 'calves'] },
  ];

  const getActiveMain = () => {
    const group = mainGroups.find(g => g.id === muscle || g.subs.includes(muscle));
    return group ? group.id : 'chest';
  };
  const activeMain = getActiveMain();
  const activeGroupObj = mainGroups.find(g => g.id === activeMain);

  const isMainGroupActive = (m) => {
    if (['chest', 'back', 'shoulders', 'arms', 'core', 'legs'].includes(muscle)) {
      const g = mainGroups.find(grp => grp.id === muscle);
      return g ? g.subs.includes(m) : false;
    }
    return false;
  };

  const getCountForGroup = (groupId) => {
    if (groupId === 'shoulders') {
      return EX.filter(e => e.cat === 'strength' && ['shoulders', 'front-delt', 'lateral-delt', 'rear-delt'].includes(e.muscle)).length;
    }
    return EX.filter(e => e.cat === 'strength' && e.muscle === groupId).length;
  };

  const filtered = EX.filter(e => {
    if (e.cat !== 'strength') return false;
    if (filter !== 'all' && e.level !== filter) return false;

    // If selecting a main group
    if (['chest', 'back', 'arms', 'core', 'legs'].includes(muscle)) {
      return e.muscle === muscle;
    }
    if (muscle === 'shoulders') {
      return ['shoulders', 'front-delt', 'lateral-delt', 'rear-delt'].includes(e.muscle);
    }

    // Specific delt heads
    if (muscle === 'front-delt' || muscle === 'lateral-delt' || muscle === 'rear-delt') {
      return e.muscle === muscle;
    }

    // Specific sub-muscles
    const searchStr = `${e.primary || ''} ${e.secondary || ''} ${e.name || ''} ${e.muscle || ''}`.toLowerCase();

    if (muscle === 'biceps') return searchStr.includes('bicep');
    if (muscle === 'triceps') return searchStr.includes('tricep') || searchStr.includes('skull crusher');
    if (muscle === 'forearms') return searchStr.includes('brachioradialis') || searchStr.includes('forearm');

    if (muscle === 'quads') return searchStr.includes('quad') || searchStr.includes('squat') || searchStr.includes('leg press');
    if (muscle === 'hamstrings') return searchStr.includes('hamstring') || searchStr.includes('leg curl') || searchStr.includes('romanian deadlift');
    if (muscle === 'glutes') return searchStr.includes('glute') || searchStr.includes('hip thrust');
    if (muscle === 'calves') return searchStr.includes('calf') || searchStr.includes('gastrocnemius');

    if (muscle === 'traps') return searchStr.includes('trap') || searchStr.includes('shrug') || searchStr.includes('upright row');
    if (muscle === 'lats') return searchStr.includes('latissimus') || searchStr.includes('lats') || searchStr.includes('pull-up') || (searchStr.includes('row') && !searchStr.includes('upright'));
    if (muscle === 'lower_back') return searchStr.includes('erector') || searchStr.includes('lower back') || searchStr.includes('deadlift');

    if (muscle === 'abs') return searchStr.includes('abs') || searchStr.includes('abdomin') || searchStr.includes('core');
    if (muscle === 'obliques') return searchStr.includes('oblique');

    if (muscle === 'chest') return searchStr.includes('chest') || searchStr.includes('pec') || searchStr.includes('press');

    return false;
  });

  return (
    <div>
      {/* Search bar */}
      <div style={{ padding: '0 16px 12px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>🔍</span>
        <input
          value={exploreSearch}
          onChange={e => setExploreSearch(e.target.value)}
          placeholder="Search exercise, upper chest, hamstrings…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: C.s2, border: `1px solid ${exploreSearch ? C.accent : C.border}`,
            borderRadius: 12, padding: '11px 14px 11px 36px',
            color: C.text, fontSize: 13, fontFamily: 'Barlow,sans-serif', outline: 'none',
          }}
        />
        {exploreSearch && (
          <button onClick={() => setExploreSearch('')} style={{
            position: 'absolute', right: 26, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: C.muted, fontSize: 16, cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        )}
      </div>

      {/* Search results mode */}
      {exploreSearch.trim().length >= 2 ? (
        <div style={{ padding: '0 16px' }}>
          {(() => {
            const q = exploreSearch.trim().toLowerCase();
            const results = EX.filter(e => {
              const hay = `${e.name || ''} ${e.muscle || ''} ${e.primary || ''} ${e.secondary || ''}`.toLowerCase();
              return hay.includes(q);
            });
            return (
              <>
                <div style={{ color: C.sub, fontSize: 11, fontFamily: fn, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  {results.length} result{results.length !== 1 ? 's' : ''} for "{exploreSearch}"
                </div>
                {results.length === 0
                  ? <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>No exercises found — try a different term</div>
                  : results.map((ex, i) => <ExCard key={i} ex={ex} />)
                }
              </>
            );
          })()}
        </div>
      ) : (
        <>
          {/* View Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, gap: 10 }}>
            {['front', 'back'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? C.accent : 'transparent',
                color: view === v ? '#111' : C.sub,
                border: `1px solid ${view === v ? C.accent : C.border}`,
                borderRadius: 20, padding: '6px 20px', fontSize: 11, fontFamily: fb,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                boxShadow: view === v ? C.accentShadow : 'none', transition: 'all 0.2s',
              }}>
                {v} View
              </button>
            ))}
          </div>

          {/* High-quality Figure */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 8px 16px' }}>
            <div style={{
              width: '100%', maxWidth: 320, height: 460,
              position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AnatomicalFigure
                view={view}
                muscle={muscle}
                onMuscleClick={(m) => {
                  setMuscle(m);
                  // Auto switch view if needed
                  if (['traps', 'lats', 'lower_back', 'triceps', 'glutes', 'hamstrings'].includes(m)) setView('back');
                  if (['chest', 'abs', 'obliques', 'biceps', 'forearms', 'quads'].includes(m)) setView('front');
                }}
                isMainGroupActive={isMainGroupActive}
              />
            </div>
          </div>

          {/* Sub-muscle chips — right below the figure, above the group grid */}
          {activeGroupObj && activeGroupObj.subs.length > 1 && (
            <div style={{ padding: '0 16px 10px', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => setMuscle(activeMain)} style={{
                background: muscle === activeMain ? (MC[activeMain] || C.accent) : 'transparent',
                color: muscle === activeMain ? '#111' : C.sub,
                border: `1px solid ${muscle === activeMain ? (MC[activeMain] || C.accent) : C.border}`,
                borderRadius: 20, padding: '6px 14px', fontSize: 10, fontFamily: fb,
                fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
                boxShadow: muscle === activeMain ? `0 0 8px ${MC[activeMain] || C.accent}44` : 'none',
                transition: 'all 0.18s',
              }}>All</button>
              {activeGroupObj.subs.map(sub => (
                <button key={sub} onClick={() => {
                  setMuscle(sub);
                  if (['traps', 'lats', 'lower_back', 'triceps', 'glutes', 'hamstrings', 'rear-delt'].includes(sub)) setView('back');
                  if (['chest', 'abs', 'obliques', 'biceps', 'forearms', 'quads', 'front-delt', 'lateral-delt'].includes(sub)) setView('front');
                }} style={{
                  background: muscle === sub ? (MC[activeMain] || C.accent) : 'transparent',
                  color: muscle === sub ? '#111' : C.sub,
                  border: `1px solid ${muscle === sub ? (MC[activeMain] || C.accent) : C.border}`,
                  borderRadius: 20, padding: '6px 14px', fontSize: 10, fontFamily: fb,
                  fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer',
                  boxShadow: muscle === sub ? `0 0 8px ${MC[activeMain] || C.accent}44` : 'none',
                  transition: 'all 0.18s',
                }}>{sub.replace(/[-_]/g, ' ')}</button>
              ))}
            </div>
          )}

          {/* Main Muscle group buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, padding: '8px 16px 4px' }}>
            {mainGroups.map(m => {
              const groupColor = MC[m.id] || C.accent;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setMuscle(m.id);
                    if (m.id === 'back') setView('back');
                    else if (['chest', 'core', 'arms', 'shoulders', 'legs'].includes(m.id)) setView('front');
                  }}
                  style={{
                    background: activeMain === m.id ? groupColor + '22' : C.s2,
                    border: `1.5px solid ${activeMain === m.id ? groupColor : C.border}`,
                    borderRadius: 12, padding: '10px 6px', textAlign: 'center', cursor: 'pointer',
                    color: activeMain === m.id ? groupColor : C.sub, fontFamily: fb, fontWeight: 700,
                    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em',
                    boxShadow: activeMain === m.id ? `0 0 8px ${groupColor}33` : 'none',
                    transition: 'all 0.18s ease',
                  }}
                >
                  {m.label}
                  <div style={{ color: C.muted, fontWeight: 400, fontSize: 9, marginTop: 2 }}>
                    {getCountForGroup(m.id)} ex
                  </div>
                </button>
              );
            })}
          </div>

          {/* Level filter chips */}
          <div style={{ padding: '12px 16px 6px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {['all', 'beginner', 'intermediate', 'advanced'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? C.s4 : 'transparent', color: filter === f ? C.text : C.muted,
                border: `1px solid ${filter === f ? C.border : 'transparent'}`,
                borderRadius: 7, padding: '5px 10px', fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer', letterSpacing: '0.04em',
              }}>{f}</button>
            ))}
          </div>

          {/* Exercise cards list */}
          <div style={{ padding: '4px 16px' }}>
            {filtered.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>No exercises found</div>
            ) : filtered.map((ex, i) => <ExCard key={i} ex={ex} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default ExploreSection;
