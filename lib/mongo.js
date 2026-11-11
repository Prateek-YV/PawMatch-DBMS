import { MongoClient } from "mongodb";

const globalForMongo = globalThis;

function getClient() {
  if (!globalForMongo.__pawmatchMongo) {
    globalForMongo.__pawmatchMongo = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
    });
  }
  return globalForMongo.__pawmatchMongo;
}

export async function mongoDb() {
  const client = getClient();
  await client.connect();
  return client.db(process.env.MONGODB_DB);
}

export async function safeMongo(fn, fallback = null) {
  try {
    const db = await mongoDb();
    return await fn(db);
  } catch (e) {
    console.error("MongoDB unavailable:", e.message);
    return fallback;
  }
}
