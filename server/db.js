const { MongoClient } = require('mongodb');

let client;
let db;

async function connect() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const memory = await MongoMemoryServer.create();
    uri = memory.getUri();
    console.log('MongoDB: in-memory instance (set MONGODB_URI for a permanent database).');
  } else {
    console.log('MongoDB: using MONGODB_URI.');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || 'virtualstage');

  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ session_token: 1 });
  await db.collection('jobs').createIndex({ user_id: 1, created_at: -1 });
  await db.collection('transactions').createIndex({ user_id: 1, created_at: -1 });
  await db.collection('events').createIndex({ user_id: 1, event_type: 1 });
  return db;
}

function getDb() {
  if (!db) throw new Error('Database is not connected.');
  return db;
}

module.exports = { connect, getDb };
