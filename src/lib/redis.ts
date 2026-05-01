import { Redis } from '@upstash/redis';

const rawUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';

// Remove any accidental quotes (e.g. from pasting "https://...")
const url = rawUrl.replace(/^["']|["']$/g, '');
const token = rawToken.replace(/^["']|["']$/g, '');

const isConfigured = !!(url && url.startsWith('https://') && token);

if (!isConfigured) {
  console.warn('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set or invalid. Redis features will be disabled.');
}

export const redis = new Redis({
  url: isConfigured ? url : 'https://placeholder.upstash.io',
  token: isConfigured ? token : 'placeholder',
});

export const redisEnabled = isConfigured;
