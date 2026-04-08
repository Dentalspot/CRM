
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Base API Configuration
 */
const CONFIG = {
  MAX_RETRIES: 2,
  TIMEOUT_MS: 15000,
  RETRY_DELAY: 1000,
};

/**
 * Custom Error class for API operations
 */
class ApiError extends Error {
  constructor(message, code, details = null, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.originalError = originalError;
  }
}

/**
 * Sleep helper for backoff
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Internal helper to handle requests with consistent logging, error handling, and retries
 */
async function executeRequest(operation, tableName, requestFn, options = {}) {
  const {
    retries = CONFIG.MAX_RETRIES,
    timeout = CONFIG.TIMEOUT_MS,
  } = options;

  let attempt = 0;
  const startTime = Date.now();

  const log = (type, data) => {
    if (import.meta.env.DEV) {
      const duration = Date.now() - startTime;
      logger.api(`${type} | ${operation} | ${tableName} (${duration}ms)`, '', data);
    }
  };

  while (attempt <= retries) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new ApiError('Request timeout', 'TIMEOUT'));
        }, timeout);
      });

      // Execute the Supabase request
      // Supabase methods usually return { data, error, count }
      // We race it against the timeout
      const response = await Promise.race([
        requestFn(),
        timeoutPromise
      ]);

      const { data, error, count } = response || {};

      if (error) {
        // Throw to trigger catch block and retry logic if applicable
        throw new ApiError(
          error.message || 'Database error', 
          error.code || 'DB_ERROR', 
          error.details,
          error
        );
      }

      log('SUCCESS', { data, count });
      
      return { 
        data, 
        error: null, 
        count: count !== undefined ? count : null 
      };

    } catch (err) {
      attempt++;
      const isLastAttempt = attempt > retries;
      const isRetryable = 
        err.code === 'TIMEOUT' || 
        err.message === 'Network request failed' ||
        (err.code && err.code.startsWith('5')); // Server errors

      // Log failure
      log(isRetryable && !isLastAttempt ? 'RETRYING' : 'ERROR', { 
        error: err, 
        attempt, 
        isRetryable 
      });

      if (!isRetryable || isLastAttempt) {
        // Return standardized error response
        return {
          data: null,
          error: {
            message: err.message || 'An unexpected error occurred',
            code: err.code || 'UNKNOWN',
            details: err.details || null,
          },
          count: null
        };
      }

      // Wait before retrying (exponential backoff)
      await sleep(CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1));
    }
  }
}

/**
 * Base API Client with standardized methods
 */
export const baseApi = {
  
  /**
   * Select data from a table
   * @param {string} table - Table name
   * @param {Object} options - Query options
   */
  async select(table, {
    columns = '*',
    filters = {},
    order = null, // { column: 'created_at', ascending: false }
    range = null, // { from: 0, to: 10 }
    limit = null,
    single = false,
    maybeSingle = false,
    count = null // 'exact', 'planned', or 'estimated'
  } = {}) {
    return executeRequest('SELECT', table, () => {
      let query = supabase.from(table).select(columns, { count });

      // Apply Filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined) return;
        
        if (value === null) {
          query = query.is(key, null);
        } else if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });

      // Apply Order
      if (order) {
        const { column, ascending = true, nullsFirst = false } = order;
        query = query.order(column, { ascending, nullsFirst });
      }

      // Apply Pagination/Range
      if (range) {
        query = query.range(range.from, range.to);
      } else if (limit) {
        query = query.limit(limit);
      }

      // Modifiers
      if (single) return query.single();
      if (maybeSingle) return query.maybeSingle();

      return query;
    });
  },

  /**
   * Insert data into a table
   * @param {string} table - Table name
   * @param {Object|Array} data - Data to insert
   * @param {Object} options - Insert options
   */
  async insert(table, data, { returning = true } = {}) {
    return executeRequest('INSERT', table, () => {
      let query = supabase.from(table).insert(data);
      if (returning) query = query.select();
      return query;
    });
  },

  /**
   * Update data in a table
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   * @param {Object} options - Update options (requires filters or id)
   */
  async update(table, data, { filters = {}, id = null, returning = true } = {}) {
    return executeRequest('UPDATE', table, () => {
      let query = supabase.from(table).update(data);
      let hasFilter = false;

      if (id) {
        query = query.eq('id', id);
        hasFilter = true;
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
          hasFilter = true;
        }
      });

      if (!hasFilter) {
        throw new Error('Update operation requires at least one filter or ID to prevent mass updates.');
      }

      if (returning) query = query.select();
      return query;
    });
  },

  /**
   * Delete data from a table
   * @param {string} table - Table name
   * @param {Object} options - Delete options (requires filters or id)
   */
  async delete(table, { filters = {}, id = null, returning = true } = {}) {
    return executeRequest('DELETE', table, () => {
      let query = supabase.from(table).delete();
      let hasFilter = false;

      if (id) {
        query = query.eq('id', id);
        hasFilter = true;
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
          hasFilter = true;
        }
      });

      if (!hasFilter) {
        throw new Error('Delete operation requires at least one filter or ID.');
      }

      if (returning) query = query.select();
      return query;
    });
  },

  /**
   * Upsert data (Insert or Update)
   * @param {string} table - Table name
   * @param {Object|Array} data - Data to upsert
   * @param {Object} options - Upsert options
   */
  async upsert(table, data, { onConflict = 'id', ignoreDuplicates = false, returning = true } = {}) {
    return executeRequest('UPSERT', table, () => {
      let query = supabase.from(table).upsert(data, { 
        onConflict, 
        ignoreDuplicates 
      });
      if (returning) query = query.select();
      return query;
    });
  },

  /**
   * Call a Postgres function (RPC)
   * @param {string} functionName - RPC function name
   * @param {Object} params - Function arguments
   */
  async rpc(functionName, params = {}) {
    return executeRequest('RPC', functionName, () => {
      return supabase.rpc(functionName, params);
    });
  },

  /**
   * Direct access to supabase client for complex queries
   */
  client: supabase
};
