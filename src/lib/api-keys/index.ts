import crypto from 'crypto';
import { getServerSupabaseAdmin } from '../supabase/server';

export interface ApiKeyMetadata {
  id: string;
  user_id: string;
  name: string;
  key_hint: string;
  key_prefix?: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface GeneratedApiKeyResult {
  id: string;
  rawKey: string;
  keyHint: string;
  createdAt: string;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  userId?: string;
  keyId?: string;
  error?: string;
}

/**
 * Generates a cryptographically secure random API key.
 * Formatted as: sw_live_[48 hex characters]
 */
export function generateSecureKey(): {
  rawKey: string;
  keyHash: string;
  keyHint: string;
  keyPrefix: string;
} {
  const randomHex = crypto.randomBytes(24).toString('hex');
  const rawKey = `sw_live_${randomHex}`;
  const keyHash = hashApiKey(rawKey);
  const keyHint = `sw_${rawKey.slice(-4)}`; // 7 characters, strictly conforms to VARCHAR(8)
  const keyPrefix = 'sw_live_';

  return { rawKey, keyHash, keyHint, keyPrefix };
}

/**
 * Computes the SHA-256 hash of an API key for secure storage and comparison.
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey.trim()).digest('hex');
}

/**
 * Retrieves all API keys belonging to a user (metadata only; secrets are never stored).
 */
export async function getUserApiKeys(userId: string): Promise<ApiKeyMetadata[]> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user API keys:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      key_hint: row.key_hint,
      key_prefix: row.key_prefix || 'sw_live_',
      is_active: row.is_active !== false && !row.revoked_at,
      created_at: row.created_at,
      last_used_at: row.last_used_at || null,
      revoked_at: row.revoked_at || null,
    }));
  } catch (err) {
    console.error('getUserApiKeys error:', err);
    return [];
  }
}

/**
 * Creates and registers a new individual API key for a specific user.
 * Revokes any previously active keys to ensure single active key per device.
 * Returns the plaintext key ONLY ONCE for the user to copy.
 */
export async function createUserApiKey(
  userId: string,
  keyName: string = 'iPhone Shortcuts Automation'
): Promise<GeneratedApiKeyResult> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase database is not configured. Check environment variables.');
  }

  // 1. Revoke any existing active keys for this user
  await revokeUserApiKey(userId);

  // 2. Generate new cryptographically secure key pair
  const { rawKey, keyHash, keyHint, keyPrefix } = generateSecureKey();

  // 3. Insert into database
  // Attempt insert with complete schema (including is_active and key_prefix)
  const insertPayload: any = {
    user_id: userId,
    name: keyName,
    key_hash: keyHash,
    key_hint: keyHint,
    key_prefix: keyPrefix,
    is_active: true,
  };

  let { data, error } = await supabase
    .from('api_keys')
    .insert(insertPayload)
    .select()
    .single();

  // If column is_active or key_prefix doesn't exist yet, retry with base columns
  if (error && error.message?.includes('column')) {
    const fallbackPayload = {
      user_id: userId,
      name: keyName,
      key_hash: keyHash,
      key_hint: keyHint,
    };
    const retry = await supabase
      .from('api_keys')
      .insert(fallbackPayload)
      .select()
      .single();

    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    throw new Error(`Failed to create API key in database: ${error?.message || 'Unknown error'}`);
  }

  return {
    id: data.id,
    rawKey,
    keyHint,
    createdAt: data.created_at,
  };
}

/**
 * Revokes an existing API key. If keyId is omitted, revokes all active keys for the user.
 */
export async function revokeUserApiKey(userId: string, keyId?: string): Promise<boolean> {
  const supabase = getServerSupabaseAdmin();
  if (!supabase) return false;

  try {
    const now = new Date().toISOString();
    let query = supabase
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: now,
      } as any)
      .eq('user_id', userId);

    if (keyId) {
      query = query.eq('id', keyId);
    }

    const { error } = await query;

    // Fallback: If is_active column does not exist yet in Postgres, delete the key so it cannot be used
    if (error && error.message?.includes('column')) {
      let delQuery = supabase.from('api_keys').delete().eq('user_id', userId);
      if (keyId) {
        delQuery = delQuery.eq('id', keyId);
      }
      await delQuery;
    }

    return true;
  } catch (err) {
    console.error('revokeUserApiKey error:', err);
    return false;
  }
}

/**
 * Validates an incoming API key from Apple Shortcuts webhook.
 * Identifies the exact user owner and ensures key is active.
 * Updates last_used_at on successful verification.
 */
export function validateApiKey(rawKey: string): Promise<ApiKeyValidationResult> {
  if (!rawKey || typeof rawKey !== 'string') {
    return Promise.resolve({ valid: false, error: 'API key is required' });
  }

  const cleanKey = rawKey
    .trim()
    .replace(/^Bearer\s*:?\s*/i, '')
    .trim()
    .replace(/^["']|["']$/g, '');

  if (!cleanKey) {
    return Promise.resolve({ valid: false, error: 'Empty API key provided' });
  }

  const hash = hashApiKey(cleanKey);
  const supabase = getServerSupabaseAdmin();
  if (!supabase) {
    return { valid: false, error: 'Server database configuration error' };
  }

  try {
    const { data: keyRecord, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', hash)
      .limit(1)
      .single();

    if (error || !keyRecord) {
      return { valid: false, error: 'Invalid API key. No matching account found.' };
    }

    // Check if key is revoked
    if (keyRecord.is_active === false || keyRecord.revoked_at) {
      return { valid: false, error: 'This API key has been revoked. Please generate a new key in SpendWise Settings.' };
    }

    // Update last_used_at timestamp asynchronously
    try {
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyRecord.id);
    } catch (e) {
      // Non-blocking update
    }

    return {
      valid: true,
      userId: keyRecord.user_id,
      keyId: keyRecord.id,
    };
  } catch (err: any) {
    console.error('validateApiKey error:', err);
    return { valid: false, error: `Validation error: ${err.message}` };
  }
}
