import { OPENAI_API_KEY, POKEMON_TCG_API_KEY } from '@env';

// export async function classifyWithOpenAI(text) {
//   const systemPrompt = [
//     'You are a Pokémon card reader.',
//     'From the raw OCR text I give you, extract exactly one valid Pokémon card name and its HP, returning ONLY valid JSON:',
//     '{ "name": "<exact card name or null>", "hp": <number or null> }',
//     'Do NOT add extra keys or commentary.',
//     '',
//     'If no valid card name or HP can be extracted, return:',
//     '{ "name": null, "hp": null }',
//     '',
//     'HP EXTRACTION RULES:',
//     '- Try to find a number that represents the HP, even if the letters "HP" are not adjacent.',
//     '- Accept noisy formats like "270o", "230:", "Z70", "HP-220", or "HP230".',
//     '- Prefer a number between 50–400 that appears near ability descriptions or Pokémon stats.',
//     '',
//     'CARD NAME RULES:',
//     '- Use the most likely capitalized Pokémon name (with suffix if present: EX, V, GX, VMAX, etc).',
//     '- You MUST only return a name that exists **with that exact HP**.',
//     '- If no such real card exists with that HP, return null.',
//     '',
//     'USE HP TO DISAMBIGUATE:',
//     '- ~120 HP → V or EX',
//     '- ~220 HP → GX or VSTAR',
//     '- 300+ HP → VMAX or TERASTAL',
//     '',
//     'ALLOWED NAME SUFFIXES: EX, V, GX, VSTAR, VMAX, LV.X, TERASTAL',
//     '',
//     'FEW-SHOT EXAMPLES:',
//     '- OCR: "…120 HP…Thunderbolt…Pikachu V"           → { "name": "Pikachu V",    "hp": 120 }',
//     '- OCR: "…310 HP…G-Max Volt Tackle…Pikachu VMAX"  → { "name": "Pikachu VMAX", "hp": 310 }',
//     '- OCR: "…330 HP…8lastojse Vn…"                   → { "name": "Blastoise VMAX", "hp": 330 }',
//     '- OCR: "…230 HP…Koraidon eX…"                    → { "name": "Koraidon EX", "hp": 230 }',
//     '- OCR: "Sylveon eK… 270o… MagiCharm"             → { "name": "Sylveon EX", "hp": 270 }',
//     '- OCR: "…HP 130…Charizard"                       → { "name": null, "hp": 130 }',
//   ].join('\n');

//   const response = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${OPENAI_API_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       model: 'gpt-4o',
//       temperature: 0,
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: text },
//       ],
//     }),
//   });

//   const raw = await response.text();
//   if (!response.ok) {
//     throw new Error(`OpenAI HTTP ${response.status}: ${raw}`);
//   }

//   let envelope;
//   try {
//     envelope = JSON.parse(raw);
//   } catch (err) {
//     console.error('Failed to parse OpenAI envelope:', raw);
//     return { name: null, hp: null };
//   }

//   const choice = envelope.choices?.[0]?.message?.content;
//   if (typeof choice !== 'string') {
//     console.warn('OpenAI returned no content:', envelope);
//     return { name: null, hp: null };
//   }

//   let parsed;
//   try {
//     parsed = JSON.parse(choice.trim());
//   } catch (err) {
//     console.warn('OpenAI did not return valid JSON:', choice);
//     return { name: null, hp: null };
//   }

//   const name = parsed.name ?? null;
//   const hp = typeof parsed.hp === 'number' ? parsed.hp : null;
//   return { name, hp };
// }

export async function fetchCardByNameAndNumber(name, number, hp = null) {
  if (!name || !number) return null;

  const cleaned = name.replace(/[^\w\s]/g, ''); // Remove special chars
  const pattern = cleaned.split(/\s+/).join('*'); // Create wildcard search

  // Fix formats like "RC31/RC32" → "RC31"
  let normalizedNumber = number;
  if (/^[A-Z]+[0-9]+\/[A-Z]*[0-9]+$/.test(number)) {
    normalizedNumber = number.split('/')[0];
  }

  // 1. Primary query
  const query = `name:*${pattern}* AND number:"${normalizedNumber}"`;
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(
    query,
  )}`;
  const res = await fetch(url, {
    headers: { 'X-Api-Key': POKEMON_TCG_API_KEY },
  });

  if (!res.ok) throw new Error(`TCG API error: ${res.status}`);
  const { data } = await res.json();

  // Check for exact HP match
  if (hp != null) {
    const exact = data.find(card => String(card.hp) === String(hp));
    if (exact) return exact;
  }

  if (data.length) return data[0];

  // 2. Fallback: try numeric part only (e.g. "017/172" → "17")
  const numeric = number.match(/\d+/g)?.[0] ?? null;
  if (!numeric) return null;

  const fallbackQuery = `name:*${pattern}* AND number:"${parseInt(
    numeric,
    10,
  )}"`;
  const fallbackUrl = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(
    fallbackQuery,
  )}`;
  const fallbackRes = await fetch(fallbackUrl, {
    headers: { 'X-Api-Key': POKEMON_TCG_API_KEY },
  });

  if (!fallbackRes.ok) throw new Error(`TCG API error: ${fallbackRes.status}`);
  const { data: fallbackData } = await fallbackRes.json();

  if (hp != null) {
    const exactFallback = fallbackData.find(
      card => String(card.hp) === String(hp),
    );
    if (exactFallback) return exactFallback;
  }

  if (fallbackData.length) return fallbackData[0];

  // 3. Final fallback: try name + HP only
  if (hp != null) {
    const looseQuery = `name:*${pattern}* AND hp:${hp}`;
    const looseUrl = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(
      looseQuery,
    )}`;
    const looseRes = await fetch(looseUrl, {
      headers: { 'X-Api-Key': POKEMON_TCG_API_KEY },
    });

    if (looseRes.ok) {
      const { data: looseData } = await looseRes.json();
      if (looseData.length) return looseData[0];
    }
  }

  return null;
}

// export async function classifyImageWithOpenAI(imageUri) {
//   const startTime = Date.now(); // Start timer
//   try {
//     const base64Image = await RNFS.readFile(imageUri, 'base64');
//     console.log(base64Image.length, 'length');

//     const response = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'gpt-4o',
//         max_tokens: 400,
//         temperature: 0,
//         messages: [
//           {
//             role: 'system',
//             content: `
// You are a Pokémon card analyzer. From the image, return valid JSON in this exact structure:

// {
//   "name": "<string or null>",
//   "hp": <number or null>,
//   "number": "<string or null>",
//   "illustrator": "<string or null>"
// }

// CARD NUMBER RULES:
// - Only return valid official Pokémon TCG number formats. Accepted formats are:
//   - "NNN/NNN"         → e.g. "148/198"
//   - "TGNN/TGNN"       → e.g. "TG02/TG30"
//   - "GGNN/GGNN"       → e.g. "GG07/GG70"
//   - "SVP###"          → e.g. "SVP007" (Scarlet & Violet Promos)
//   - "SWSH###"         → e.g. "SWSH133"
//   - "SM###", "XY###"  → Older promos

// CORRECTION RULE:
// - If the card shows a number format with an unrecognized or invalid prefix (e.g. "SVI", "SV1", "SV", "SWH", etc.):
//   - You MUST convert it into the closest legal format using known TCG rules.
//   - Preserve the numeric part if readable.
//   - Fix the prefix based on the card’s generation or promo style.
//   - Examples:
//     - "SVI007" → "SVP007"
//     - "SV 107" → "107/198"
//     - "SWH133" → "SWSH133"
//   - If you're unsure or the number is unreadable, return "number": null

// ILLUSTRATOR RULE:
// - The "illustrator" field is usually printed near the bottom, sometimes prefixed with "illus." or "illustrated by".
// - If visible and readable, return the name as a string. Otherwise, return null.

// STRICT OUTPUT:
// - Never return values like "SVI007", "SV1 107", or any unlisted formats.
// - Return only valid JSON. Do not return any extra formatting, explanation, or markdown.
//             `.trim(),
//           },
//           {
//             role: 'user',
//             content: [
//               {
//                 type: 'text',
//                 text: 'Extract the Pokémon name, HP, legal number, and illustrator from this image. Fix number formats. Return JSON only.',
//               },
//               {
//                 type: 'image_url',
//                 image_url: {
//                   url: `data:image/png;base64,${base64Image}`,
//                 },
//               },
//             ],
//           },
//         ],
//       }),
//     });
//     const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
//     console.log(`⏱️ OpenAI response time: ${durationSec}s`);
//     const raw = await response.text();

//     if (!response.ok) {
//       console.error(`❌ OpenAI HTTP error: ${response.status}`);
//       return { name: null, hp: null, number: null, illustrator: null };
//     }

//     let envelope;
//     try {
//       envelope = JSON.parse(raw);
//     } catch (err) {
//       console.error('❌ Failed to parse OpenAI response JSON:\n', raw);
//       return { name: null, hp: null, number: null, illustrator: null };
//     }

//     const content = envelope?.choices?.[0]?.message?.content;
//     if (!content) {
//       console.warn('⚠️ OpenAI returned empty or undefined content.');
//       return { name: null, hp: null, number: null, illustrator: null };
//     }

//     try {
//       const cleaned = content
//         .trim()
//         .replace(/^```json/, '')
//         .replace(/^```/, '')
//         .replace(/```$/, '')
//         .trim();

//       const parsed = JSON.parse(cleaned);
//       return {
//         name: parsed.name ?? null,
//         hp: typeof parsed.hp === 'number' ? parsed.hp : null,
//         number: parsed.number ?? null,
//         illustrator: parsed.illustrator ?? null,
//       };
//     } catch (err) {
//       console.warn('⚠️ Could not parse OpenAI JSON:\n', content);
//       return { name: null, hp: null, number: null, illustrator: null };
//     }
//   } catch (err) {
//     console.error('❌ Error during classification:', err);
//     return { name: null, hp: null, number: null, illustrator: null };
//   }
// }
export async function classifyImageWithOpenAI(imageUrl) {
  const startTime = Date.now(); // Start timer
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 400,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `
You are a Pokémon card analyzer. From the image, return valid JSON in this exact structure:

{
  "name": "<string or null>",
  "hp": <number or null>,
  "number": "<string or null>",
  "illustrator": "<string or null>"
}

CARD NUMBER RULES:
- Only return valid official Pokémon TCG number formats. Accepted formats are:
  - "NNN/NNN"         → e.g. "148/198"
  - "TGNN/TGNN"       → e.g. "TG02/TG30"
  - "GGNN/GGNN"       → e.g. "GG07/GG70"
  - "SVP###"          → e.g. "SVP007" (Scarlet & Violet Promos)
  - "SWSH###"         → e.g. "SWSH133"
  - "SM###", "XY###"  → Older promos

CORRECTION RULE:
- If the card shows a number format with an unrecognized or invalid prefix (e.g. "SVI", "SV1", "SV", "SWH", etc.):
  - You MUST convert it into the closest legal format using known TCG rules.
  - Preserve the numeric part if readable.
  - Fix the prefix based on the card’s generation or promo style.
  - Examples:
    - "SVI007" → "SVP007"
    - "SV 107" → "107/198"
    - "SWH133" → "SWSH133"
  - If you're unsure or the number is unreadable, return "number": null

ILLUSTRATOR RULE:
- The "illustrator" field is usually printed near the bottom, sometimes prefixed with "illus." or "illustrated by".
- If visible and readable, return the name as a string. Otherwise, return null.

STRICT OUTPUT:
- Never return values like "SVI007", "SV1 107", or any unlisted formats.
- Return only valid JSON. Do not return any extra formatting, explanation, or markdown.
            `.trim(),
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the Pokémon name, HP, legal number, and illustrator from this image. Fix number formats. Return JSON only.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ OpenAI response time: ${durationSec}s`);
    const raw = await response.text();

    if (!response.ok) {
      console.error(`❌ OpenAI HTTP error: ${response.status}`);
      return { name: null, hp: null, number: null, illustrator: null };
    }

    let envelope;
    try {
      envelope = JSON.parse(raw);
    } catch (err) {
      console.error('❌ Failed to parse OpenAI response JSON:\n', raw);
      return { name: null, hp: null, number: null, illustrator: null };
    }

    const content = envelope?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('⚠️ OpenAI returned empty or undefined content.');
      return { name: null, hp: null, number: null, illustrator: null };
    }

    try {
      const cleaned = content
        .trim()
        .replace(/^```json/, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      return {
        name: parsed.name ?? null,
        hp: typeof parsed.hp === 'number' ? parsed.hp : null,
        number: parsed.number ?? null,
        illustrator: parsed.illustrator ?? null,
      };
    } catch (err) {
      console.warn('⚠️ Could not parse OpenAI JSON:\n', content);
      return { name: null, hp: null, number: null, illustrator: null };
    }
  } catch (err) {
    console.error('❌ Error during classification:', err);
    return { name: null, hp: null, number: null, illustrator: null };
  }
}
