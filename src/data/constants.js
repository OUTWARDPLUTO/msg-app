export const BASE_DRI = {
  calories: 2200, protein: 150, carbs: 220, fat: 70, fiber: 30,
  sodium: 2300, potassium: 3500, calcium: 1000, iron: 18,
  vitaminA: 900, vitaminB12: 2.4, vitaminC: 90, vitaminD: 20, vitaminE: 15,
  magnesium: 400, zinc: 11,
};

export const NMETA = [
  { key: 'protein',    label: 'Protein',      unit: 'g',   cat: 'macro',   color: '#4E9FFF' },
  { key: 'carbs',      label: 'Carbohydrates', unit: 'g',   cat: 'macro',   color: '#2DD4BF' },
  { key: 'fat',        label: 'Fat',           unit: 'g',   cat: 'macro',   color: '#FF6240' },
  { key: 'fiber',      label: 'Fiber',         unit: 'g',   cat: 'macro',   color: '#A78BFA' },
  { key: 'sodium',     label: 'Sodium',        unit: 'mg',  cat: 'mineral', color: '#94A3B8' },
  { key: 'potassium',  label: 'Potassium',     unit: 'mg',  cat: 'mineral', color: '#F472B6' },
  { key: 'calcium',    label: 'Calcium',       unit: 'mg',  cat: 'mineral', color: '#4E9FFF' },
  { key: 'iron',       label: 'Iron',          unit: 'mg',  cat: 'mineral', color: '#FF6240' },
  { key: 'magnesium',  label: 'Magnesium',     unit: 'mg',  cat: 'mineral', color: '#93C5FD' },
  { key: 'zinc',       label: 'Zinc',          unit: 'mg',  cat: 'mineral', color: '#C4B5FD' },
  { key: 'vitaminA',   label: 'Vitamin A',     unit: 'mcg', cat: 'vitamin', color: '#FBBF24' },
  { key: 'vitaminB12', label: 'Vitamin B12',   unit: 'mcg', cat: 'vitamin', color: '#A78BFA' },
  { key: 'vitaminC',   label: 'Vitamin C',     unit: 'mg',  cat: 'vitamin', color: '#4ADE80' },
  { key: 'vitaminD',   label: 'Vitamin D',     unit: 'mcg', cat: 'vitamin', color: '#FDE68A' },
  { key: 'vitaminE',   label: 'Vitamin E',     unit: 'mg',  cat: 'vitamin', color: '#6EE7B7' },
];

export const OR_KEY = import.meta.env.VITE_OR_KEY ?? '';
export const OR_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callClaude(sys, userMsg) {
  const r = await fetch(OR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OR_KEY}`,
      'HTTP-Referer': 'https://msg-app-mu.vercel.app',
      'X-Title': 'MSG - My Smart Gains',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct',
      max_tokens: 1200,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: userMsg },
      ],
    }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenRouter error ${r.status}`);
  }
  const data = await r.json();
  return data.choices?.[0]?.message?.content ?? '';
}
