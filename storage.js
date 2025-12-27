import fs from 'fs/promises';
import path from 'path';
import Redis from 'ioredis';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDataDir = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
const DATA_DIR = process.env.DATA_DIR || defaultDataDir;

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL;
let redisClient = null;
if (redisUrl) {
  redisClient = new Redis(redisUrl, { lazyConnect: true, tls: redisUrl.startsWith('rediss://') ? {} : undefined });
  redisClient.connect().catch(err => {
    console.warn('Redis connect failed, falling back to file storage:', err?.message || err);
    redisClient = null;
  });
}

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  refCodes: path.join(DATA_DIR, 'ref-codes.json'),
  approvals: path.join(DATA_DIR, 'approvals.json'),
  countdownOverride: path.join(DATA_DIR, 'countdown-override.json')
};

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
}

async function readFileJson(key, fallback) {
  try {
    const raw = await fs.readFile(FILES[key], 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeFileJson(key, value) {
  await ensureDir();
  await fs.writeFile(FILES[key], JSON.stringify(value, null, 2));
}

async function readRedisJson(key, fallback) {
  if (!redisClient) return fallback;
  try {
    const raw = await redisClient.get(`staking:${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Redis read error for ${key}:`, err?.message || err);
    return fallback;
  }
}

async function writeRedisJson(key, value) {
  if (!redisClient) return;
  try {
    await redisClient.set(`staking:${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn(`Redis write error for ${key}:`, err?.message || err);
  }
}

const readJson = async (key, fallback) => {
  if (redisClient) {
    const val = await readRedisJson(key, undefined);
    if (val !== undefined) return val;
  }
  const fileVal = await readFileJson(key, fallback);
  return fileVal;
};

const writeJson = async (key, value) => {
  if (redisClient) await writeRedisJson(key, value);
  await writeFileJson(key, value);
};

export const storage = {
  readUsers: () => readJson('users', []),
  writeUsers: (v) => writeJson('users', v),
  readRefCodes: () => readJson('refCodes', {}),
  writeRefCodes: (v) => writeJson('refCodes', v),
  readApprovals: () => readJson('approvals', []),
  writeApprovals: (v) => writeJson('approvals', v),
  readCountdownOverride: () => readJson('countdownOverride', null),
  writeCountdownOverride: (v) => writeJson('countdownOverride', v)
};

export const STORAGE_MODE = redisClient ? 'redis' : 'file';
