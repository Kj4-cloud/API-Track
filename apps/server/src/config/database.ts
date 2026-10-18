import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { hashPassword } from '../utils/auth.js';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const dbPath =
  process.env.DATABASE_PATH ||
  path.resolve(process.cwd(), 'data/tracker.db');

// Ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) return dbInstance;

  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  initializeSchema(dbInstance);
  seedInitialData(dbInstance);

  return dbInstance;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Profiles table
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      avatar_url TEXT,
      timezone TEXT DEFAULT 'Asia/Kolkata',
      currency TEXT DEFAULT 'INR',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );

    -- API Services table
    CREATE TABLE IF NOT EXISTS api_services (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      website TEXT,
      api_key_encrypted TEXT,
      environment TEXT NOT NULL DEFAULT 'development',
      status TEXT NOT NULL DEFAULT 'active',
      token_limit INTEGER NOT NULL DEFAULT 0,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Subscriptions table
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      api_id TEXT,
      plan_name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      start_date TEXT NOT NULL,
      renewal_date TEXT,
      auto_renew INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      payment_method TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (api_id) REFERENCES api_services(id) ON DELETE SET NULL
    );

    -- Usage Logs table
    CREATE TABLE IF NOT EXISTS usage_logs (
      id TEXT PRIMARY KEY,
      api_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      requests INTEGER NOT NULL DEFAULT 0,
      tokens_used INTEGER NOT NULL DEFAULT 0,
      credits_used REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(api_id, user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (api_id) REFERENCES api_services(id) ON DELETE CASCADE
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'system',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      link TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- User Preferences table
    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      usage_warning_threshold INTEGER DEFAULT 70,
      usage_critical_threshold INTEGER DEFAULT 90,
      email_notifications INTEGER DEFAULT 1,
      renewal_reminder_days INTEGER DEFAULT 7,
      theme TEXT DEFAULT 'light',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_api_services_user ON api_services(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_user_api ON usage_logs(user_id, api_id);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_date ON usage_logs(date);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
  `);
}

function seedInitialData(db: Database.Database) {
  // 1. Seed Categories
  const categoryCount = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as any).count;
  if (categoryCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)');
    const defaultCategories = [
      ['cat-ai', 'AI', 'Large Language Models, embeddings, and vision processing APIs'],
      ['cat-cloud', 'Cloud', 'Infrastructure, serverless computing, and hosting providers'],
      ['cat-db', 'Database', 'Managed SQL, NoSQL, and vector storage solutions'],
      ['cat-pay', 'Payments', 'Payment gateways, billing engines, and checkout systems'],
      ['cat-comm', 'Communication', 'SMS, transactional email, voice, and chat APIs'],
      ['cat-analytics', 'Analytics', 'Telemetry, product analytics, and monitoring systems'],
      ['cat-security', 'Security', 'Auth0, identity validation, and compliance APIs'],
      ['cat-other', 'Other', 'Utility, scraping, search, and developer tool services'],
    ];
    for (const cat of defaultCategories) {
      insertCat.run(cat[0], cat[1], cat[2]);
    }
  }

  // 2. Seed Default Demo User if no user exists
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount === 0) {
    const demoUserId = 'usr-demo-001';
    const demoEmail = 'developer@company.com';
    const hashedPass = hashPassword('password123');

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name)
      VALUES (?, ?, ?, ?)
    `).run(demoUserId, demoEmail, hashedPass, 'Alex Developer');

    db.prepare(`
      INSERT INTO profiles (id, name, email, timezone, currency)
      VALUES (?, ?, ?, ?, ?)
    `).run(demoUserId, 'Alex Developer', demoEmail, 'Asia/Kolkata', 'INR');

    db.prepare(`
      INSERT INTO user_preferences (id, user_id, usage_warning_threshold, usage_critical_threshold, email_notifications, renewal_reminder_days, theme)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('pref-demo-001', demoUserId, 70, 90, 1, 7, 'light');

    // 3. Seed Realistic API Services for the Demo User
    const api1 = crypto.randomUUID();
    const api2 = crypto.randomUUID();
    const api3 = crypto.randomUUID();
    const api4 = crypto.randomUUID();
    const api5 = crypto.randomUUID();

    const insertApi = db.prepare(`
      INSERT INTO api_services (id, user_id, provider, name, category, website, api_key_encrypted, environment, status, token_limit, tokens_used, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertApi.run(
      api1, demoUserId, 'OpenAI', 'GPT-4o Omnimodel', 'AI',
      'https://platform.openai.com', 'sk-proj-...8xJ9', 'production', 'active',
      2000000, 1420500, 'Primary generative reasoning and function calling API'
    );
    insertApi.run(
      api2, demoUserId, 'Anthropic', 'Claude 3.5 Sonnet', 'AI',
      'https://console.anthropic.com', 'sk-ant-...4mL2', 'production', 'active',
      1500000, 890000, 'Code refactoring and agentic workflow orchestration'
    );
    insertApi.run(
      api3, demoUserId, 'Groq', 'Llama 3.3 70B Fast', 'AI',
      'https://console.groq.com', 'gsk_...91xP', 'development', 'active',
      5000000, 1240000, 'Ultra-low latency inference for real-time auto-complete'
    );
    insertApi.run(
      api4, demoUserId, 'AWS', 'Bedrock Foundation Models', 'Cloud',
      'https://aws.amazon.com/bedrock', 'AKIA...92KA', 'staging', 'active',
      1000000, 310000, 'Backup failover endpoint for enterprise workloads'
    );
    insertApi.run(
      api5, demoUserId, 'Stripe', 'Stripe Payments v2', 'Payments',
      'https://dashboard.stripe.com', 'sk_live_...44bb', 'production', 'active',
      500000, 85000, 'Customer subscription processing and invoice webhooks'
    );

    // 4. Seed Subscriptions in INR (₹)
    const insertSub = db.prepare(`
      INSERT INTO subscriptions (id, user_id, api_id, plan_name, price, currency, billing_cycle, start_date, renewal_date, auto_renew, status, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    const renewal1 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const renewal2 = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const renewal3 = new Date(now.getTime() + 24 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pastStart = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    insertSub.run(
      crypto.randomUUID(), demoUserId, api1, 'OpenAI Plus Tier', 1650.00, 'INR',
      'monthly', pastStart, renewal1, 1, 'active', 'Corporate Visa ending in 4242'
    );
    insertSub.run(
      crypto.randomUUID(), demoUserId, api2, 'Anthropic Pro Team', 1650.00, 'INR',
      'monthly', pastStart, renewal2, 1, 'active', 'HDFC Mastercard ending in 8891'
    );
    insertSub.run(
      crypto.randomUUID(), demoUserId, null, 'GitHub Copilot Enterprise', 825.00, 'INR',
      'monthly', pastStart, renewal3, 1, 'active', 'Corporate Card ending in 4242'
    );

    // 5. Seed Usage Logs for the last 10 days
    const insertUsage = db.prepare(`
      INSERT INTO usage_logs (id, api_id, user_id, date, requests, tokens_used, credits_used, cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 10; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const req1 = Math.floor(120 + Math.random() * 80);
      const tok1 = Math.floor(req1 * (800 + Math.random() * 600));
      const cost1 = Math.round((tok1 / 1000) * 0.15 * 100) / 100;
      insertUsage.run(crypto.randomUUID(), api1, demoUserId, d, req1, tok1, cost1, cost1);

      const req2 = Math.floor(70 + Math.random() * 50);
      const tok2 = Math.floor(req2 * (600 + Math.random() * 400));
      const cost2 = Math.round((tok2 / 1000) * 0.12 * 100) / 100;
      insertUsage.run(crypto.randomUUID(), api2, demoUserId, d, req2, tok2, cost2, cost2);
    }

    // 6. Seed Notifications
    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, is_read, link)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertNotif.run(
      crypto.randomUUID(), demoUserId, 'usage_warning',
      'OpenAI Quota Warning (71% Reached)',
      'GPT-4o Omnimodel has reached 1,420,500 of 2,000,000 allocated monthly tokens.',
      0, '/apis/' + api1
    );
    insertNotif.run(
      crypto.randomUUID(), demoUserId, 'renewal',
      'OpenAI Plus Tier Renews Soon',
      `Your subscription of ₹1,650 will renew in 5 days (${renewal1}).`,
      0, '/subscriptions'
    );
    insertNotif.run(
      crypto.randomUUID(), demoUserId, 'system',
      'SQLite Local Database Initialized',
      'Successfully migrated from Supabase cloud database to local SQLite database.',
      1, '/settings'
    );
  }
}
