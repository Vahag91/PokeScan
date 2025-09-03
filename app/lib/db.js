// utils/db.js
import SQLite from 'react-native-sqlite-storage';
import uuid from 'react-native-uuid';
import RNFS from 'react-native-fs';

SQLite.enablePromise(true);

export async function getDBConnection() {
  const db = await SQLite.openDatabase({
    name: 'collections.db',
    location: 'default',
  });
  await db.executeSql('PRAGMA foreign_keys = ON;'); // ✅ Enable foreign key constraints
  return db;
}
export async function createTables(db) {
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      notes TEXT,
      totalValue REAL
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS collection_cards (
      id TEXT PRIMARY KEY NOT NULL,
      collectionId TEXT NOT NULL,
      cardId TEXT NOT NULL,
      addedAt TEXT NOT NULL,
      customName TEXT,
      quantity INTEGER DEFAULT 1,
      language TEXT DEFAULT 'EN',
      edition TEXT DEFAULT 'Unlimited',
      notes TEXT,
      imagePath TEXT,

      -- Core metadata
      name TEXT,
      hp TEXT,
      rarity TEXT,
      types TEXT,
      subtypes TEXT,

      -- Set info
      setId TEXT,
      setName TEXT,
      seriesName TEXT,
      setLogo TEXT,
      releaseDate TEXT,

      -- Attacks & Abilities
      attacks TEXT,
      abilities TEXT,

      -- Defense
      weaknesses TEXT,
      resistances TEXT,
      retreatCost TEXT,

      -- Extra
      artist TEXT,
      flavorText TEXT,
      number TEXT,
      tcgplayerUrl TEXT,
      cardmarketUrl TEXT,

      -- Price details
      tcgplayerPrices TEXT,
      cardmarketPrices TEXT,

      FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE CASCADE
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS card_prices (
      cardId TEXT PRIMARY KEY,
      tcgplayerPrices TEXT,
      cardmarketPrices TEXT,
      updatedAt TEXT
    )
  `);
}


// export async function addCardToCollection(card, collectionId, language = 'en') {
//   const db = await getDBConnection();

//   const {
//     id,
//     name,
//     hp,
//     rarity,
//     types,
//     subtypes,
//     attacks,
//     abilities,
//     weaknesses,
//     resistances,
//     retreatCost,
//     artist,
//     flavorText,
//     number,
//     tcgplayer,
//     cardmarket,
//     set,
//     image,
//   } = card;

//   const rowId = uuid.v4();
//   const setLogoId = uuid.v4();

//   const cardImageUrl = image || null;
//   const setLogoUrl = set?.logo || null;

//   const localCardImagePath = cardImageUrl
//     ? await downloadImageIfNeeded(cardImageUrl, `${rowId}.jpeg`)
//     : null;

//   const localSetLogoPath = setLogoUrl
//     ? await downloadImageIfNeeded(setLogoUrl, `${setLogoId}_logo.jpeg`)
//     : null;

//   const imageFileName = localCardImagePath
//     ? localCardImagePath.split('/').pop()
//     : null;

//   const setLogoFileName = localSetLogoPath
//     ? localSetLogoPath.split('/').pop()
//     : null;

//   const safeJson = (val, fallback = '[]') => {
//     try {
//       return JSON.stringify(val ?? []);
//     } catch {
//       return fallback;
//     }
//   };

//   const setId = set?.setId ?? null;

//   await db.executeSql(
//     `
//     INSERT INTO collection_cards (
//       id, collectionId, cardId, addedAt,
//       customName, quantity, language, edition, notes, imagePath,
//       name, hp, rarity, types, subtypes,
//       setId, setName, seriesName, setLogo, releaseDate,
//       attacks, abilities, weaknesses, resistances, retreatCost,
//       artist, flavorText, number, tcgplayerUrl, cardmarketUrl,
//       tcgplayerPrices, cardmarketPrices
//     )
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `,
//     [
//       rowId,
//       collectionId,
//       id,
//       new Date().toISOString(),

//       null,
//       1,
//       language.toUpperCase(),
//       'Unlimited',
//       null,
//       imageFileName,

//       name ?? null,
//       hp ?? null,
//       rarity ?? null,
//       safeJson(types),
//       safeJson(subtypes),

//       setId,
//       set?.name ?? null,
//       set?.series ?? null,
//       setLogoFileName,
//       set?.releaseDate ?? null,

//       safeJson(attacks),
//       safeJson(abilities),
//       safeJson(weaknesses),
//       safeJson(resistances),
//       safeJson(retreatCost),

//       artist ?? null,
//       flavorText ?? null,
//       number ?? null,
//       tcgplayer?.url ?? null,
//       cardmarket?.url ?? null,

//       safeJson(tcgplayer?.prices, '{}'),
//       safeJson(cardmarket?.prices, '{}'),
//     ]
//   );

//   await updateCollectionTotalValue(db, collectionId);
// }
export async function addCardToCollection(card, collectionId, language = 'en') {
  const db = await getDBConnection();

  const {
    id,
    name,
    hp,
    rarity,
    types,
    subtypes,
    attacks,
    abilities,
    weaknesses,
    resistances,
    retreatCost,
    artist,
    flavorText,
    number,
    tcgplayer,
    cardmarket,
    set,
    image,
  } = card;

  const rowId = uuid.v4();
  const setLogoId = uuid.v4();

  const cardImageUrl = image || null;
  const setLogoUrl = set?.logo || null;

  const localCardImagePath = cardImageUrl
    ? await downloadImageIfNeeded(cardImageUrl, `${rowId}.jpeg`)
    : null;

  const localSetLogoPath = setLogoUrl
    ? await downloadImageIfNeeded(setLogoUrl, `${setLogoId}_logo.jpeg`)
    : null;

  const imageFileName = localCardImagePath
    ? localCardImagePath.split('/').pop()
    : null;

  const setLogoFileName = localSetLogoPath
    ? localSetLogoPath.split('/').pop()
    : null;

  const safeJson = (val, fallback = '[]') => {
    try {
      return JSON.stringify(val ?? JSON.parse(fallback));
    } catch {
      return fallback;
    }
  };

  const setId = set?.setId ?? null;

  // ✅ Minimal, safe normalization (new rows only)
  const langRaw = String(language || 'en').toLowerCase();
  const safeLang = (langRaw === 'jp' || langRaw === 'en') ? langRaw : 'en';

  await db.executeSql(
    `
    INSERT INTO collection_cards (
      id, collectionId, cardId, addedAt,
      customName, quantity, language, edition, notes, imagePath,
      name, hp, rarity, types, subtypes,
      setId, setName, seriesName, setLogo, releaseDate,
      attacks, abilities, weaknesses, resistances, retreatCost,
      artist, flavorText, number, tcgplayerUrl, cardmarketUrl,
      tcgplayerPrices, cardmarketPrices
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      rowId,
      collectionId,
      id,
      new Date().toISOString(),

      null,
      1,
      safeLang,                 // ⬅️ was language.toUpperCase()
      'Unlimited',
      null,
      imageFileName,

      name ?? null,
      hp ?? null,
      rarity ?? null,
      safeJson(types),
      safeJson(subtypes),

      setId,
      set?.name ?? null,
      set?.series ?? null,
      setLogoFileName,
      set?.releaseDate ?? null,

      safeJson(attacks),
      safeJson(abilities),
      safeJson(weaknesses),
      safeJson(resistances),
      safeJson(retreatCost),

      artist ?? null,
      flavorText ?? null,
      number ?? null,
      tcgplayer?.url ?? null,
      cardmarket?.url ?? null,

      safeJson(tcgplayer?.prices, '{}'),
      safeJson(cardmarket?.prices, '{}'),
    ]
  );

  await updateCollectionTotalValue(db, collectionId);
}

export async function downloadImageIfNeeded(url, filename) {
  try {
    const localPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
    const exists = await RNFS.exists(localPath);
    if (!exists) {
      const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
      }).promise;
      if (result.statusCode === 200) {
        return `file://${localPath}`;
      }
      return null;
    }
    return `file://${localPath}`;
  } catch (err) {
    return null;
  }
}
export async function createCollection(db, name) {
  const id = uuid.v4(); // <-- this is now correctly used
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;

  try {
    await db.executeSql(
      `
      INSERT INTO collections (id, name, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `,
      [id, name, createdAt, updatedAt],
    );
    return { id, name, createdAt, updatedAt };
  } catch (error) {
    throw error;
  }
}
export async function getAllCollections(db) {
  try {
    const [result] = await db.executeSql(`
      SELECT collections.*, COUNT(collection_cards.id) AS cardCount
      FROM collections
      LEFT JOIN collection_cards ON collections.id = collection_cards.collectionId
      GROUP BY collections.id
      ORDER BY collections.createdAt DESC
    `);

    const collections = [];
    const rows = result.rows;
    for (let i = 0; i < rows.length; i++) {
      collections.push(rows.item(i));
    }

    return collections;
  } catch (error) {
    return [];
  }
}
export async function getAllCollectionsWithPreviewCards(db) {
  try {
    // Check if 'collections' table exists
    const [checkTables] = await db.executeSql(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='collections';
    `);

    if (checkTables.rows.length === 0) {
      return [];
    }

    const [result] = await db.executeSql(`
      SELECT collections.*, COUNT(collection_cards.id) AS cardCount
      FROM collections
      LEFT JOIN collection_cards ON collections.id = collection_cards.collectionId
      GROUP BY collections.id
      ORDER BY collections.createdAt DESC
    `);

    const collections = [];
    const rows = result.rows;

    for (let i = 0; i < rows.length; i++) {
      const collection = rows.item(i);

      // Fetch up to 3 preview cards (local image paths)
      const [cardResult] = await db.executeSql(
        `
        SELECT imagePath FROM collection_cards
        WHERE collectionId = ?
        AND imagePath IS NOT NULL
        LIMIT 3
      `,
        [collection.id],
      );

      const cardImages = [];
      const cardRows = cardResult.rows;
      for (let j = 0; j < cardRows.length; j++) {
        cardImages.push(cardRows.item(j).imagePath);
      }

      collections.push({
        ...collection,
        previewCards: cardImages,
      });
    }

    return collections;
  } catch (error) {
    return [];
  }
}

// Duplicate one existing collection_cards row (keeps same imagePath, setLogo, etc.)
export async function duplicateOneCardRow(db, cardId, collectionId) {
  const newId = uuid.v4();
  const now = new Date().toISOString();

  // Copy any existing row for that (collectionId, cardId) pair
  await db.executeSql(
    `
    INSERT INTO collection_cards (
      id, collectionId, cardId, addedAt,
      customName, quantity, language, edition, notes, imagePath,
      name, hp, rarity, types, subtypes,
      setId, setName, seriesName, setLogo, releaseDate,
      attacks, abilities, weaknesses, resistances, retreatCost,
      artist, flavorText, number, tcgplayerUrl, cardmarketUrl,
      tcgplayerPrices, cardmarketPrices
    )
    SELECT
      ?, collectionId, cardId, ?,
      customName, 1, language, edition, notes, imagePath,
      name, hp, rarity, types, subtypes,
      setId, setName, seriesName, setLogo, releaseDate,
      attacks, abilities, weaknesses, resistances, retreatCost,
      artist, flavorText, number, tcgplayerUrl, cardmarketUrl,
      tcgplayerPrices, cardmarketPrices
    FROM collection_cards
    WHERE collectionId = ? AND cardId = ?
    LIMIT 1
    `,
    [newId, now, collectionId, cardId]
  );

  await updateCollectionTotalValue(db, collectionId);
}


export async function getCardsForCollection(db, collectionId) {
  try {
    const [results] = await db.executeSql(
      `SELECT * FROM collection_cards WHERE collectionId = ? ORDER BY addedAt DESC`,
      [collectionId],
    );

    const cards = [];
    for (let i = 0; i < results.rows.length; i++) {
      cards.push(results.rows.item(i));
    }

    return cards;
  } catch (error) {
    return [];
  }
}
export async function getCardsByCollectionId(db, collectionId) {
  try {
    const results = await db.executeSql(
      `SELECT * FROM collection_cards WHERE collectionId = ?`,
      [collectionId],
    );

    const cards = [];
    results.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        const item = result.rows.item(i);

        cards.push({
          ...item,
          types: JSON.parse(item.types || '[]'),
          subtypes: JSON.parse(item.subtypes || '[]'),
          attacks: JSON.parse(item.attacks || '[]'),
          abilities: JSON.parse(item.abilities || '[]'),
          weaknesses: JSON.parse(item.weaknesses || '[]'),
          resistances: JSON.parse(item.resistances || '[]'),
          retreatCost: JSON.parse(item.retreatCost || '[]'),
          tcgplayerPrices: JSON.parse(item.tcgplayerPrices || '{}'),
          cardmarketPrices: JSON.parse(item.cardmarketPrices || '{}'),
        });
      }
    });

    return cards;
  } catch (error) {
    return [];
  }
}
export async function getCollectionsForCard(db, cardId) {
  try {
    const results = await db.executeSql(
      `SELECT collectionId FROM collection_cards WHERE cardId = ?`,
      [cardId],
    );
    const rows = results[0].rows;
    const collectionIds = [];
    for (let i = 0; i < rows.length; i++) {
      collectionIds.push(rows.item(i).collectionId);
    }
    return collectionIds;
  } catch (error) {
    return [];
  }
}
export async function getCollectionCountsForCard(db, cardId) {
  const results = await db.executeSql(
    `SELECT collectionId, COUNT(*) as count FROM collection_cards WHERE cardId = ? GROUP BY collectionId`,
    [cardId],
  );

  const map = {};
  const rows = results[0].rows;
  for (let i = 0; i < rows.length; i++) {
    const row = rows.item(i);
    map[row.collectionId] = row.count;
  }

  return map;
}
export async function updateCollectionTotalValue(db, collectionId) {
  try {
    const [results] = await db.executeSql(
      `SELECT tcgplayerPrices, cardmarketPrices, quantity, language FROM collection_cards WHERE collectionId = ?`,
      [collectionId],
    );

    const pickFirstNumber = (arr) => {
      for (const v of arr) {
        const n = parseFloat(v);
        if (!Number.isNaN(n)) return n;
      }
      return NaN;
    };

    const extractTcgPrice = (tcgRaw, language = 'EN') => {
      const tcg = safeJsonParse(tcgRaw);
      const src = tcg?.prices ?? tcg ?? {};
      
      // Dynamic approach: find any foil type with a market price
      const allPrices = [];
      
      // Recursively find all market prices in the prices object
      const findMarketPrices = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'market' && typeof value === 'number' && value > 0) {
            allPrices.push(value);
          } else if (typeof value === 'object') {
            findMarketPrices(value);
          }
        }
      };
      
      findMarketPrices(src);
      
      // Return the first valid price found, or NaN if none
      return allPrices.length > 0 ? allPrices[0] : NaN;
    };

    const extractCmkPrice = (cmkRaw) => {
      const cmk = safeJsonParse(cmkRaw);
      const src = cmk?.prices ?? cmk ?? {};
      return pickFirstNumber([
        src?.averageSellPrice,
        src?.trendPrice,
        src?.lowPrice,
      ]);
    };

    let total = 0;
    const rows = results.rows;

    for (let i = 0; i < rows.length; i++) {
      const quantity = rows.item(i).quantity || 1;
      const language = rows.item(i).language || 'EN';

      let price = extractTcgPrice(rows.item(i).tcgplayerPrices, language);
      if (Number.isNaN(price)) {
        price = extractCmkPrice(rows.item(i).cardmarketPrices);
      }

      if (!isNaN(price)) {
        total += price * quantity;
      }
    }

    await db.executeSql(
      `UPDATE collections SET totalValue = ?, updatedAt = ? WHERE id = ?`,
      [total, new Date().toISOString(), collectionId],
    );
  } catch (_) {}
}
function safeJsonParse(input) {
  try {
    return JSON.parse(input || '{}');
  } catch {
    return {};
  }
}
export async function removeCardFromCollectionByRowId(db, rowid, collectionId) {
  await db.executeSql(`DELETE FROM collection_cards WHERE rowid = ?`, [rowid]);
  await updateCollectionTotalValue(db, collectionId);
}
export async function removeAllCopiesOfCard(db, cardId, collectionId) {
  await db.executeSql(
    `DELETE FROM collection_cards WHERE cardId = ? AND collectionId = ?`,
    [cardId, collectionId],
  );
  await updateCollectionTotalValue(db, collectionId);
}
export async function updateCardNotes(cardRowId, newNote, collectionId) {
  const db = await getDBConnection();
  await db.executeSql(
    `UPDATE collection_cards SET notes = ?, updatedAt = ? WHERE id = ?`,
    [newNote, new Date().toISOString(), cardRowId],
  );
  await updateCollectionTotalValue(db, collectionId);
}
export async function renameCollection(db, collectionId, newName) {
  const updatedAt = new Date().toISOString();
  await db.executeSql(
    `UPDATE collections SET name = ?, updatedAt = ? WHERE id = ?`,
    [newName, updatedAt, collectionId],
  );
}
export async function deleteCollection(db, collectionId) {
  await db.executeSql(`DELETE FROM collections WHERE id = ?`, [collectionId]);
}
export async function deleteDatabase() {
  try {
    await SQLite.deleteDatabase({
      name: 'collections.db',
      location: 'default',
    });
  } catch (_) {
  }
}
export async function getOwnedCardCountsBySet() {
  const db = await getDBConnection();

  // Get owned card counts grouped by setId and setName for better matching
  const [results] = await db.executeSql(`
    SELECT setId, setName, COUNT(DISTINCT cardId) as ownedCount
    FROM collection_cards
    WHERE setId IS NOT NULL
    GROUP BY setId, setName
  `);

  const map = {};
  for (let i = 0; i < results.rows.length; i++) {
    const row = results.rows.item(i);
    // Use setId as primary key, but also store by setName as fallback
    if (row.setId) {
      map[row.setId] = row.ownedCount;
    }
    // Also map by setName for cases where setId might not match
    if (row.setName) {
      map[row.setName] = (map[row.setName] || 0) + row.ownedCount;
    }
  }
  return map;
}