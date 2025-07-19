// import { createClient } from "@supabase/supabase-js";
// import fetch from "node-fetch";
// import sharp from "sharp";

// const supabaseUrl = "https://orvklxcroobcnwzgiank.supabase.co";
// const supabaseKey =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydmtseGNyb29iY253emdpYW5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY2MTUyOSwiZXhwIjoyMDY4MjM3NTI5fQ.UWUAHGJ3EdkOM8tMZXNS39veEnOQSxlXTocpS0HVNbk";
// const pokeKey = "96b19782-71f8-4f2d-b594-92674f19363d";
// const supabase = createClient(supabaseUrl, supabaseKey);

// async function fetchWithRetry(url, options = {}, retries = 3) {
//   for (let i = 0; i < retries; i++) {
//     try {
//       const res = await fetch(url, options);
//       if (!res.ok) throw new Error(`Fetch error: ${res.statusText}`);
//       const json = await res.json();
//       return json;
//     } catch (err) {
//       console.warn(`⚠️ Attempt ${i + 1} failed: ${err.message}`);
//       await new Promise((r) => setTimeout(r, 500 * (i + 1)));
//     }
//   }
//   throw new Error("❌ All retries failed.");
// }

// async function downloadAndCompressImage(url, filename, quality, width) {
//   const downloadStart = Date.now();
//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
//   const buffer = await res.buffer();
//   const downloadTime = Date.now() - downloadStart;

//   const compressStart = Date.now();
//   const compressed = await sharp(buffer)
//     .resize({ width })
//     .webp({ quality })
//     .toBuffer();
//   const compressTime = Date.now() - compressStart;

//   const uploadStart = Date.now();
//   const { error } = await supabase.storage
//     .from("cards")
//     .upload(filename, compressed, {
//       contentType: "image/webp",
//       upsert: true,
//     });
//   const uploadTime = Date.now() - uploadStart;

//   if (error) {
//     console.error(`❌ Upload failed for ${filename}:`, error.message);
//     return null;
//   }

//   const { data: publicUrlData } = supabase.storage
//     .from("cards")
//     .getPublicUrl(filename);

//   console.log(
//     `🖼️ ${filename} → download: ${downloadTime}ms, compress: ${compressTime}ms, upload: ${uploadTime}ms`
//   );

//   return publicUrlData.publicUrl;
// }

// async function processSingleCard(card) {
//   const id = card.id;

//   // ✅ Check if card already exists
//   const { data: existing, error: checkError } = await supabase
//     .from("cards")
//     .select("id")
//     .eq("id", id)
//     .maybeSingle();

//   if (checkError) {
//     console.error(`❌ Supabase check failed for ${id}:`, checkError.message);
//     return false;
//   }

//   if (existing) {
//     console.log(`⏭️ Skipping ${id} (already exists in Supabase)`);
//     return false;
//   }

//   const cardStart = Date.now();

//   try {
//     const largeStart = Date.now();
//     const largeImageUrl = card.images?.large
//       ? await downloadAndCompressImage(
//           card.images.large,
//           `${id}_large.webp`,
//           80,
//           1024
//         )
//       : null;
//     const largeTime = Date.now() - largeStart;

//     const smallStart = Date.now();
//     const smallImageUrl = card.images?.small
//       ? await downloadAndCompressImage(
//           card.images.small,
//           `${id}_small.webp`,
//           50,
//           320
//         )
//       : null;
//     const smallTime = Date.now() - smallStart;

//     const payload = {
//       id,
//       name: card.name || null,
//       supertype: card.supertype || null,
//       subtypes: card.subtypes || [],
//       level: card.level || null,
//       hp: parseInt(card.hp, 10) || null,
//       types: card.types || [],
//       evolvesfrom: card.evolvesFrom || null,
//       evolvesto: card.evolvesTo || [],
//       rules: card.rules || [],
//       attacks: card.attacks || null,
//       abilities: card.abilities || null,
//       weaknesses: card.weaknesses || null,
//       resistances: card.resistances || null,
//       retreatcost: card.retreatCost || [],
//       convertedretreatcost: card.convertedRetreatCost || null,
//       set: card.set || null,
//       number: card.number || null,
//       artist: card.artist || null,
//       rarity: card.rarity || null,
//       flavortext: card.flavorText || null,
//       nationalpokedexnumbers: card.nationalPokedexNumbers || [],
//       regulationmark: card.regulationMark || null,
//       legalities: card.legalities || null,
//       images: {
//         small: smallImageUrl,
//         large: largeImageUrl,
//       },
//       tcgplayer: card.tcgplayer || null,
//       cardmarket: card.cardmarket || null,
//     };

//     const dbStart = Date.now();
//     const { error } = await supabase.from("cards").upsert(payload);
//     const dbTime = Date.now() - dbStart;
//     const totalTime = Date.now() - cardStart;

//     if (error) {
//       console.error(`❌ Error inserting ${id}:`, error.message);
//       return false;
//     }

//     console.log(
//       `✅ [${id}] large: ${largeTime}ms, small: ${smallTime}ms, db: ${dbTime}ms, total: ${totalTime}ms`
//     );

//     return true;
//   } catch (err) {
//     console.error(`⚠️ Error processing card ${id}:`, err.message);
//     return false;
//   }
// }

// async function importAllCards() {
//   let page = 1;
//   const pageSize = 250;
//   let totalImported = 0;

//   while (true) {
//     const url = `https://api.pokemontcg.io/v2/cards?page=${page}&pageSize=${pageSize}`;
//     let json;

//     try {
//       json = await fetchWithRetry(url, {
//         headers: { "X-Api-Key": pokeKey },
//       });
//     } catch (err) {
//       console.error(`❌ Fetch failed on page ${page}: ${err.message}`);
//       break;
//     }

//     const cards = json?.data;
//     if (!cards || cards.length === 0) break;

//     for (let i = 0; i < cards.length; i++) {
//       const success = await processSingleCard(cards[i]);
//       if (success) totalImported++;
//     }

//     console.log(`✅ Page ${page} imported (${cards.length} cards)`);
//     page++;
//   }

//   console.log(`🎉 Finished. Total cards imported: ${totalImported}`);
// }

// importAllCards().catch(console.error);



//SECONDDDDDD
// const cardsToUpdate = [
//   {
//     id: "mcd15-1",
//     small: 'https://static.tcgcollector.com/content/images/77/be/51/77be512633d92aae13931b0e115825d74531a2199bd10c7a54f5534c3465d006.jpg',
//     large: 'https://static.tcgcollector.com/content/images/77/be/51/77be512633d92aae13931b0e115825d74531a2199bd10c7a54f5534c3465d006.jpg',
//   },
//     {
//     id: 'mcd15-2',
//     small: 'https://static.tcgcollector.com/content/images/97/35/70/97357030fafdd2fcf39980fbe8c746926d908ff7dde295b098808885ac1c8347.jpg',
//     large: 'https://static.tcgcollector.com/content/images/97/35/70/97357030fafdd2fcf39980fbe8c746926d908ff7dde295b098808885ac1c8347.jpg',
//   },
//     {
//     id: 'mcd15-3',
//     small: 'https://static.tcgcollector.com/content/images/d4/c5/ce/d4c5ce3f7d785ad0f8c4b64a9df41cfac02ed5a8fd26c0e9a8de0a89be426283.jpg',
//     large: 'https://static.tcgcollector.com/content/images/d4/c5/ce/d4c5ce3f7d785ad0f8c4b64a9df41cfac02ed5a8fd26c0e9a8de0a89be426283.jpg',
//   },
//     {
//     id: 'mcd15-4',
//         small: 'https://static.tcgcollector.com/content/images/1e/b3/c9/1eb3c9c4c0ffcac6af84fea3323b33e90027907b38142281142d1427fca14dda.jpg',
//     large: 'https://static.tcgcollector.com/content/images/1e/b3/c9/1eb3c9c4c0ffcac6af84fea3323b33e90027907b38142281142d1427fca14dda.jpg',
//   },
//     {
//     id: 'mcd15-5',
//     small: 'https://static.tcgcollector.com/content/images/b3/8a/e5/b38ae56078cc1768d3b68f09a3548409a13fa1c95c869c22c66fd9daabbedcc2.jpg',
//     large: 'https://static.tcgcollector.com/content/images/b3/8a/e5/b38ae56078cc1768d3b68f09a3548409a13fa1c95c869c22c66fd9daabbedcc2.jpg',
//   },
//     {
//     id: 'mcd15-6',
//     small: 'https://static.tcgcollector.com/content/images/89/bf/4d/89bf4d962a84d6cc1ac64bf8895fa6cafc5f29cff8bbb43b6e9b7d523b37ec13.jpg',
//     large: 'https://static.tcgcollector.com/content/images/89/bf/4d/89bf4d962a84d6cc1ac64bf8895fa6cafc5f29cff8bbb43b6e9b7d523b37ec13.jpg',
//   },
//     {
//     id: 'mcd15-7',
//     small: 'https://static.tcgcollector.com/content/images/80/c9/04/80c9047b068385a3697e20663eaf6fa5b7e8a2b2ce1f27ecd7c1ad97e993c7f3.jpg',
//     large: 'https://static.tcgcollector.com/content/images/80/c9/04/80c9047b068385a3697e20663eaf6fa5b7e8a2b2ce1f27ecd7c1ad97e993c7f3.jpg',
//   },
//     {
//     id: 'mcd15-8',
//     small: 'https://static.tcgcollector.com/content/images/6a/89/f2/6a89f28e209ed893f0bbde09d4654e557d9dbfea7d9e817dbeebfe5b0fc6d1d4.jpg',
//     large: 'https://static.tcgcollector.com/content/images/6a/89/f2/6a89f28e209ed893f0bbde09d4654e557d9dbfea7d9e817dbeebfe5b0fc6d1d4.jpg',
//   },
//     {
//     id: 'mcd15-9',
//     small: 'https://static.tcgcollector.com/content/images/06/0a/3f/060a3f02bf15ed2293e052366163ac851586fecc31ed1958124091daf2b59d11.jpg',
//     large: 'https://static.tcgcollector.com/content/images/06/0a/3f/060a3f02bf15ed2293e052366163ac851586fecc31ed1958124091daf2b59d11.jpg',
//   },
//     {
//     id:'mcd15-10',
//     small: 'https://static.tcgcollector.com/content/images/52/a2/a2/52a2a24a49e32728392d58924820a222d4d5026e7c1fa5b337eb9bb9749c03a8.jpg',
//     large: 'https://static.tcgcollector.com/content/images/52/a2/a2/52a2a24a49e32728392d58924820a222d4d5026e7c1fa5b337eb9bb9749c03a8.jpg',
//   },
//     {
//     id: 'mcd15-11',
//     small: 'https://static.tcgcollector.com/content/images/38/f0/74/38f074f0f964c2c20d3d1fffc42c8ae34f88d41ef55752b8970a709b372691c1.jpg',
//     large: 'https://static.tcgcollector.com/content/images/38/f0/74/38f074f0f964c2c20d3d1fffc42c8ae34f88d41ef55752b8970a709b372691c1.jpg',
//   },
//     {
//     id: 'mcd15-12',
//     small: 'https://static.tcgcollector.com/content/images/a0/87/93/a087935e49938fb9c77d8a8157cc9eb46b303cfe6919da8d0b7b7e2b120b8687.jpg',
//     large: 'https://static.tcgcollector.com/content/images/a0/87/93/a087935e49938fb9c77d8a8157cc9eb46b303cfe6919da8d0b7b7e2b120b8687.jpg',
//   },
// ];

// import { createClient } from '@supabase/supabase-js';
// import fetch from 'node-fetch';
// import sharp from 'sharp';

// const supabaseUrl = 'https://orvklxcroobcnwzgiank.supabase.co';
// const supabaseKey =
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydmtseGNyb29iY253emdpYW5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY2MTUyOSwiZXhwIjoyMDY4MjM3NTI5fQ.UWUAHGJ3EdkOM8tMZXNS39veEnOQSxlXTocpS0HVNbk';
// const supabase = createClient(supabaseUrl, supabaseKey);

// async function downloadAndCompressImage(url, filename, quality, width) {
//   if (!url || typeof url !== 'string' || !url.startsWith('http')) {
//     throw new Error(`Invalid URL: ${url}`);
//   }

//   const downloadStart = Date.now();
//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
//   const buffer = await res.buffer();
//   const downloadTime = Date.now() - downloadStart;

//   const compressStart = Date.now();
//   const compressed = await sharp(buffer)
//     .resize({ width })
//     .webp({ quality })
//     .toBuffer();
//   const compressTime = Date.now() - compressStart;

//   const uploadStart = Date.now();
//   const { error } = await supabase.storage
//     .from('cards')
//     .upload(filename, compressed, {
//       contentType: 'image/webp',
//       upsert: true,
//     });
//   const uploadTime = Date.now() - uploadStart;

//   if (error) {
//     console.error(`❌ Upload failed for ${filename}:`, error.message);
//     return null;
//   }

//   const { data: publicUrlData } = supabase.storage
//     .from('cards')
//     .getPublicUrl(filename);

//   console.log(
//     `🖼️ ${filename} → download: ${downloadTime}ms, compress: ${compressTime}ms, upload: ${uploadTime}ms`,
//   );

//   return publicUrlData.publicUrl;
// }

// async function updateImagesOnly() {
//   for (const card of cardsToUpdate) {
//     try {
//       if (!card.small || !card.large) {
//         console.warn(`⚠️ Skipping ${card.id} due to missing image URLs`);
//         continue;
//       }

//       console.log(`📦 Processing ${card.id}`, card.small, card.large);

//       const smallUrl = await downloadAndCompressImage(
//         card.small,
//         `${card.id}_small.webp`,
//         50,
//         320,
//       );
//       const largeUrl = await downloadAndCompressImage(
//         card.large,
//         `${card.id}_large.webp`,
//         80,
//         1024,
//       );

//       const { error } = await supabase
//         .from('cards')
//         .update({ images: { small: smallUrl, large: largeUrl } })
//         .eq('id', card.id);

//       if (error) {
//         console.error(`❌ DB update failed for ${card.id}:`, error.message);
//       } else {
//         console.log(`✅ Updated ${card.id} with new images`);
//       }
//     } catch (err) {
//       console.error(`❌ Error processing ${card.id}:`, err.message);
//     }
//   }

//   console.log('🎉 All updates complete');
// }

// updateImagesOnly().catch(console.error);
