/**
 * @typedef {import('./database').Database} Database
 *
 * Shortcuts for table row types.
 * Usage with JSDoc:
 *   /** @type {Tables['patients']} *\/
 *   const patient = data;
 *
 * These types are auto-generated from supabase gen types.
 * To regenerate: supabase gen types typescript --linked > src/types/database.ts
 */

/** @template {keyof Database['public']['Tables']} T */

/**
 * Row type for a public table
 * @typedef {Database['public']['Tables'][T]['Row']} TableRow
 */

/**
 * Insert type for a public table
 * @typedef {Database['public']['Tables'][T]['Insert']} TableInsert
 */

/**
 * Update type for a public table
 * @typedef {Database['public']['Tables'][T]['Update']} TableUpdate
 */
