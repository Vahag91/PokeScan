import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { decode } from 'https://deno.land/std@0.177.0/encoding/base64.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openAiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async (req) => {
  console.time('⚡ Total time');
  try {
    const { base64Image } = await req.json();

    if (!base64Image) {
      console.error('❌ Missing base64Image');
      return new Response(
        JSON.stringify({ error: 'Missing base64Image' }),
        { status: 400 },
      );
    }

    console.time('📄 Decode base64');
    const buffer = decode(base64Image);
    console.timeEnd('📄 Decode base64');

    const fileName = `scan-${Date.now()}.jpg`;

    console.time('📤 Upload to Supabase Storage');
    const { error: uploadError } = await supabase.storage
      .from('scans')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    console.timeEnd('📤 Upload to Supabase Storage');

    if (uploadError) {
      console.error('❌ Upload error:', uploadError.message);
      return new Response(
        JSON.stringify({ error: 'Upload failed' }),
        { status: 500 },
      );
    }

    const { data: urlData } = await supabase.storage
      .from('scans')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;
    console.log('✅ Image uploaded:', imageUrl);

    console.time('🤖 OpenAI classify');
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0,
        max_tokens: 400,
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
                text: 'Extract name, hp, number, and illustrator.',
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
      }),
    });
    console.timeEnd('🤖 OpenAI classify');

    const raw = await aiRes.text();
    console.log('🧠 OpenAI raw:', raw);

    if (!aiRes.ok) {
      console.error('❌ OpenAI error:', aiRes.status);
      return new Response(
        JSON.stringify({ error: 'OpenAI call failed' }),
        { status: 500 },
      );
    }

    let content;
    try {
      const envelope = JSON.parse(raw);
      content = envelope?.choices?.[0]?.message?.content;
    } catch {
      console.error('❌ Invalid OpenAI JSON');
      return new Response(
        JSON.stringify({ error: 'OpenAI JSON parse failed' }),
        { status: 500 },
      );
    }

    try {
      console.time('🧹 Clean and parse AI JSON');
      const cleaned = content
        .trim()
        .replace(/^```json/, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      console.timeEnd('🧹 Clean and parse AI JSON');

      console.timeEnd('⚡ Total time');

      return new Response(JSON.stringify({
        name: parsed.name ?? null,
        hp: typeof parsed.hp === 'number' ? parsed.hp : null,
        number: parsed.number ?? null,
        illustrator: parsed.illustrator ?? null,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('❌ Final JSON parse error:', e);
      return new Response(
        JSON.stringify({ error: 'Final parse failed' }),
        { status: 500 },
      );
    }

  } catch (err) {
    console.error('❌ Global error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 },
    );
  }
});