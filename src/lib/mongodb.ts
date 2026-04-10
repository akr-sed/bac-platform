import mongoose from 'mongoose';

const mongodbUri = process.env.MONGODB_URI;

if (!mongodbUri) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.__mongooseCache) {
  global.__mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongodbUri as string);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
