// Eva new memory - e no dey forget again
import { kv } from '@vercel/kv';

// Save user or anything
export async function saveToEva(key, data) {
  await kv.set(key, data);
  return true;
}

// Get user or anything
export async function getFromEva(key) {
  const data = await kv.get(key);
  return data;
}

// For chat - add message
export async function addMessage(userId, message) {
  await kv.lpush(`chat:${userId}`, message);
}

// For chat - get all messages
export async function getMessages(userId) {
  const msgs = await kv.lrange(`chat:${userId}`, 0, -1);
  return msgs.reverse();
}
