/**
 * Seeds MongoDB with the content of the original alamwaj.ae site.
 *   npm run seed            -> fills empty collections, creates the admin user if missing
 *   npm run seed -- --reset -> wipes content collections first (users and enquiries are kept)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { runSeed } from '../src/lib/seed.js';

try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/alamwaj');
  await runSeed({ reset: process.argv.includes('--reset') });
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
