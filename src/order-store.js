import { Redis } from '@upstash/redis';

const ORDER_INDEX = 'pop-culture:orders';
const NEXT_ORDER_ID = 'pop-culture:orders:next-id';
const keyForOrder = id => `pop-culture:order:${id}`;
const keyForEmail = email => `pop-culture:orders:email:${String(email).trim().toLowerCase()}`;

let redisClient;

function getRedis() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN
    });
  }
  return redisClient;
}

export function persistentOrdersEnabled() {
  return Boolean(getRedis());
}

export async function nextPersistentOrderId() {
  const redis = getRedis();
  if (!redis) return null;
  await redis.setnx(NEXT_ORDER_ID, 2000);
  return Number(await redis.incr(NEXT_ORDER_ID));
}

export async function savePersistentOrder(order) {
  const redis = getRedis();
  if (!redis) return false;
  const timestamp = Date.parse(`${order.created_at}Z`) || Date.now();
  await Promise.all([
    redis.set(keyForOrder(order.id), order),
    redis.zadd(ORDER_INDEX, { score: timestamp, member: String(order.id) }),
    redis.sadd(keyForEmail(order.email), String(order.id))
  ]);
  return true;
}

export async function getPersistentOrder(id) {
  const redis = getRedis();
  if (!redis) return null;
  return redis.get(keyForOrder(id));
}

async function getOrdersByIds(ids) {
  if (!ids.length) return [];
  const orders = await Promise.all(ids.map(id => getPersistentOrder(id)));
  return orders.filter(Boolean).sort((a, b) => Number(b.id) - Number(a.id));
}

export async function listPersistentOrders() {
  const redis = getRedis();
  if (!redis) return [];
  const ids = await redis.zrange(ORDER_INDEX, 0, -1, { rev: true });
  return getOrdersByIds(ids);
}

export async function listPersistentOrdersByEmail(email) {
  const redis = getRedis();
  if (!redis) return [];
  const ids = await redis.smembers(keyForEmail(email));
  return getOrdersByIds(ids);
}

export async function updatePersistentOrderStatus(id, status, note, createdAt) {
  const order = await getPersistentOrder(id);
  if (!order) return null;
  if (order.status === status) return order;
  order.status = status;
  order.history = [...(order.history || []), { status, note, created_at: createdAt }];
  order.updated_at = createdAt;
  await savePersistentOrder(order);
  return order;
}
