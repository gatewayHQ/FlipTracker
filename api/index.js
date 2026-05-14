'use strict';

// api/index.js — Vercel serverless entry point
// Server TypeScript is pre-compiled to server/dist/ by the buildCommand.
// Using plain JS here avoids any @vercel/node TypeScript compilation issues.

const { initializeSchema } = require('../server/dist/db/schema');
const { default: app } = require('../server/dist/app');

// Cache the init promise so schema runs once per cold start, not per request
let initPromise = null;

module.exports = async function handler(req, res) {
  if (!initPromise) {
    initPromise = initializeSchema().catch(err => {
      console.error('Schema init failed:', err);
      initPromise = null; // allow retry on next request
    });
  }
  await initPromise;
  return app(req, res);
};
