import { getDBConnection, createTables } from "./db";

export async function initDatabase() {
  try {
    const db = await getDBConnection();
    await createTables(db);
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Failed to initialize DB:', error);
  }
}

export async function testDatabase() {
  try {
    const db = await getDBConnection();

    // Insert dummy collection
    await db.executeSql(
      `INSERT OR IGNORE INTO collections (id, name, createdAt) VALUES (?, ?, ?)`,
      ['test-1', 'Test Collection', new Date().toISOString()]
    );

    // Insert dummy card into collection_cards
    await db.executeSql(
      `INSERT OR IGNORE INTO collection_cards (
        id, collectionId, cardId, addedAt, quantity, language, edition, 
        notes, imagePath, setName, seriesName
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'card-1',
        'test-1',
        'swsh12-001',
        new Date().toISOString(),
        2,
        'EN',
        'Unlimited',
        'Some notes...',
        '/path/to/image.jpg',
        'Silver Tempest',
        'Sword & Shield',
        5.99,
      ]
    );

    // Query and log results
    const [collectionsResult] = await db.executeSql(`SELECT * FROM collections`);
    const [cardsResult] = await db.executeSql(`SELECT * FROM collection_cards`);

    console.log('📦 Collections:', collectionsResult.rows.raw());
    console.log('🃏 Collection Cards:', cardsResult.rows.raw());
  } catch (error) {
    console.error('❌ DB Test Failed:', error);
  }
}
