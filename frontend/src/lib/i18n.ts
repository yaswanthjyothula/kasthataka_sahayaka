// ─── Indian Language Registry ─────────────────────────────────────────────────
// To add a new language: just add an entry here. The AI translator handles the rest.
export const LANGUAGES = [
  { code: 'en',  native: 'English',   name: 'English' },
  { code: 'hi',  native: 'हिन्दी',     name: 'Hindi' },
  { code: 'kn',  native: 'ಕನ್ನಡ',      name: 'Kannada' },
  { code: 'te',  native: 'తెలుగు',     name: 'Telugu' },
  { code: 'ta',  native: 'தமிழ்',      name: 'Tamil' },
  { code: 'ml',  native: 'മലയാളം',     name: 'Malayalam' },
  { code: 'mr',  native: 'मराठी',      name: 'Marathi' },
  { code: 'gu',  native: 'ગુજરાતી',    name: 'Gujarati' },
  { code: 'pa',  native: 'ਪੰਜਾਬੀ',     name: 'Punjabi' },
  { code: 'or',  native: 'ଓଡ଼ିଆ',       name: 'Odia' },
  { code: 'bn',  native: 'বাংলা',       name: 'Bengali' },
  { code: 'as',  native: 'অসমীয়া',     name: 'Assamese' },
  { code: 'ur',  native: 'اردو',        name: 'Urdu' },
  { code: 'bho', native: 'भोजपुरी',     name: 'Bhojpuri' },
  { code: 'mai', native: 'मैथिली',      name: 'Maithili' },
  { code: 'kok', native: 'कोंकणी',      name: 'Konkani' },
  { code: 'ne',  native: 'नेपाली',      name: 'Nepali' },
  { code: 'doi', native: 'डोगरी',       name: 'Dogri' },
  { code: 'sa',  native: 'संस्कृत',      name: 'Sanskrit' },
] as const;

export type LangCode = typeof LANGUAGES[number]['code'];
export const LANG_STORAGE_KEY = 'ks_lang';

/**
 * AI Batch Translator — sends all UI strings to OpenRouter in one call.
 * Returns a map of { key: translatedText }.
 * Add data-i18n to any new element and it's automatically included.
 */
export async function aiTranslate(
  texts: Record<string, string>,
  targetLang: LangCode,
  targetLangName: string
): Promise<Record<string, string>> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
  if (!apiKey || targetLang === 'en') return texts;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Kasthataka Sahayaka',
    },
    body: JSON.stringify({
      model: 'google/gemma-4-26b-a4b-it:free',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator for an agricultural app for Indian farmers.
Translate UI text into ${targetLangName} (code: ${targetLang}).
Rules:
- Return ONLY valid JSON with the same keys as input. No markdown, no explanation.
- Keep proper nouns unchanged: Kasthataka Sahayaka, CIBRC, GPS, AI, Leaf Blast, Tricyclazole.
- Keep badge labels short and concise.
- Tone: practical, farmer-friendly.`,
        },
        {
          role: 'user',
          content: `Translate this JSON to ${targetLangName}:\n${JSON.stringify(texts)}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Translation API ${res.status}`);
  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content || '{}';
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(clean) as Record<string, string>;
  } catch {
    console.error('Translation parse error:', raw.substring(0, 200));
    return texts;
  }
}

// Session cache — avoids re-calling API when switching tabs
export function getCachedTranslation(lang: LangCode): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`ks_trans_${lang}`);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch { return null; }
}

export function setCachedTranslation(lang: LangCode, data: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(`ks_trans_${lang}`, JSON.stringify(data)); } catch {}
}
