// ─── Member Data Module ─────────────────────────────────────────────────────
// All exercise data, nutrition constants, and AI proxy function
// Extracted from MemberApp.jsx for modular architecture

import { C } from '../shared/theme.js';

// ─── Exercise Database ──────────────────────────────────────────────────────
// muscle tags: chest | back | front-delt | lateral-delt | rear-delt | arms | core | legs | calves | glutes | traps | forearms
export { EX } from './constants.js';

// ─── Nutrition Data ─────────────────────────────────────────────────────────
export const BASE_DRI = {
  calories: 2200, protein: 150, carbs: 220, fat: 70, fiber: 30,
  sodium: 2300, potassium: 3500, calcium: 1000, iron: 18,
  vitaminA: 900, vitaminB12: 2.4, vitaminC: 90, vitaminD: 20, vitaminE: 15,
  magnesium: 400, zinc: 11,
};

export const NMETA = [
  { key: 'protein', label: 'Protein', unit: 'g', cat: 'macro', color: C.blue },
  { key: 'carbs', label: 'Carbohydrates', unit: 'g', cat: 'macro', color: C.teal },
  { key: 'fat', label: 'Fat', unit: 'g', cat: 'macro', color: C.orange },
  { key: 'fiber', label: 'Fiber', unit: 'g', cat: 'macro', color: C.purple },
  { key: 'sodium', label: 'Sodium', unit: 'mg', cat: 'mineral', color: '#94A3B8' },
  { key: 'potassium', label: 'Potassium', unit: 'mg', cat: 'mineral', color: C.pink },
  { key: 'calcium', label: 'Calcium', unit: 'mg', cat: 'mineral', color: C.blue },
  { key: 'iron', label: 'Iron', unit: 'mg', cat: 'mineral', color: C.orange },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', cat: 'mineral', color: '#93C5FD' },
  { key: 'zinc', label: 'Zinc', unit: 'mg', cat: 'mineral', color: '#C4B5FD' },
  { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg', cat: 'vitamin', color: '#FBBF24' },
  { key: 'vitaminB12', label: 'Vitamin B12', unit: 'mcg', cat: 'vitamin', color: C.purple },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', cat: 'vitamin', color: C.green },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg', cat: 'vitamin', color: '#FDE68A' },
  { key: 'vitaminE', label: 'Vitamin E', unit: 'mg', cat: 'vitamin', color: '#6EE7B7' },
];

export const DEF_MEALS = [
  { name: 'Oats with milk & banana', calories: 380, protein: 12, carbs: 65, fat: 7, fiber: 6, sodium: 180, potassium: 480, calcium: 180, iron: 3.2, vitaminA: 40, vitaminB12: 0.8, vitaminC: 8, vitaminD: 1.2, vitaminE: 1.5, magnesium: 55, zinc: 1.8 },
  { name: 'Whey protein shake', calories: 150, protein: 28, carbs: 6, fat: 2, fiber: 1, sodium: 140, potassium: 320, calcium: 200, iron: 1.0, vitaminA: 0, vitaminB12: 1.2, vitaminC: 0, vitaminD: 2.0, vitaminE: 0.5, magnesium: 30, zinc: 2.5 },
  { name: 'Boiled eggs ×3', calories: 210, protein: 18, carbs: 1, fat: 15, fiber: 0, sodium: 210, potassium: 200, calcium: 75, iron: 2.7, vitaminA: 270, vitaminB12: 1.8, vitaminC: 0, vitaminD: 3.0, vitaminE: 1.5, magnesium: 30, zinc: 1.8 },
];

export const DEF_LOGS = [
  { date: 'Feb 7', weight: 74.2, bodyFat: 18.5, chest: 96, waist: 82, arms: 35, legs: 55, notes: '' },
  { date: 'Feb 14', weight: 73.8, bodyFat: 18.1, chest: 96.5, waist: 81, arms: 35.5, legs: 55, notes: 'Feeling more energy' },
  { date: 'Feb 21', weight: 73.5, bodyFat: 17.8, chest: 97, waist: 80.5, arms: 36, legs: 55.5, notes: '' },
  { date: 'Feb 28', weight: 73.1, bodyFat: 17.4, chest: 97, waist: 80, arms: 36, legs: 56, notes: 'Sleep getting better' },
  { date: 'Mar 7', weight: 72.8, bodyFat: 17.1, chest: 97.5, waist: 79, arms: 36.5, legs: 56, notes: '' },
  { date: 'Mar 14', weight: 72.5, bodyFat: 16.8, chest: 98, waist: 78.5, arms: 37, legs: 56.5, notes: 'PR on bench today 🔥' },
];

// ─── AI API (Secure Proxy) ───────────────────────────────────────────────────
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function callClaude(sys, userMsg) {
  const r = await fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      max_tokens: 2500,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: userMsg },
      ],
      response_format: { type: 'json_object' }
    }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.error || `Server error ${r.status}`);
  }
  const data = await r.json();
  return data.choices?.[0]?.message?.content ?? '';
}
