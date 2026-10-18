import { getDatabase } from '../../config/database.js';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileRecord {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  timezone: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export class AuthRepository {
  private get db() {
    return getDatabase();
  }

  findByEmail(email: string): UserRecord | undefined {
    return this.db
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
      .get(email) as UserRecord | undefined;
  }

  findById(id: string): UserRecord | undefined {
    return this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as UserRecord | undefined;
  }

  getProfile(id: string): ProfileRecord | undefined {
    return this.db
      .prepare('SELECT * FROM profiles WHERE id = ?')
      .get(id) as ProfileRecord | undefined;
  }

  createUser(params: {
    email: string;
    passwordHash: string;
    name: string;
  }): { user: UserRecord; profile: ProfileRecord } {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertUser = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertProfile = this.db.prepare(`
      INSERT INTO profiles (id, name, email, timezone, currency, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPrefs = this.db.prepare(`
      INSERT INTO user_preferences (id, user_id, usage_warning_threshold, usage_critical_threshold, email_notifications, renewal_reminder_days, theme, created_at, updated_at)
      VALUES (?, ?, 70, 90, 1, 7, 'light', ?, ?)
    `);

    const runTx = this.db.transaction(() => {
      insertUser.run(id, params.email.toLowerCase(), params.passwordHash, params.name, now, now);
      insertProfile.run(id, params.name, params.email.toLowerCase(), 'Asia/Kolkata', 'INR', now, now);
      insertPrefs.run(crypto.randomUUID(), id, now, now);
    });

    runTx();

    const user = this.findById(id)!;
    const profile = this.getProfile(id)!;
    return { user, profile };
  }

  updateProfile(id: string, data: Partial<ProfileRecord>): ProfileRecord {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
      // also update user name
      this.db.prepare('UPDATE users SET name = ? WHERE id = ?').run(data.name, id);
    }
    if (data.timezone !== undefined) {
      fields.push('timezone = ?');
      values.push(data.timezone);
    }
    if (data.currency !== undefined) {
      fields.push('currency = ?');
      values.push(data.currency);
    }
    if (data.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(data.avatar_url);
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(id);
      this.db.prepare(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    return this.getProfile(id)!;
  }

  updatePassword(id: string, newPasswordHash: string): void {
    this.db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).run(newPasswordHash, id);
  }

  getPreferences(userId: string) {
    let prefs = this.db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId);
    if (!prefs) {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      this.db.prepare(`
        INSERT INTO user_preferences (id, user_id, usage_warning_threshold, usage_critical_threshold, email_notifications, renewal_reminder_days, theme, created_at, updated_at)
        VALUES (?, ?, 70, 90, 1, 7, 'light', ?, ?)
      `).run(id, userId, now, now);
      prefs = this.db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId);
    }
    return prefs;
  }

  updatePreferences(userId: string, data: any) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.usage_warning_threshold !== undefined) {
      fields.push('usage_warning_threshold = ?');
      values.push(Number(data.usage_warning_threshold));
    }
    if (data.usage_critical_threshold !== undefined) {
      fields.push('usage_critical_threshold = ?');
      values.push(Number(data.usage_critical_threshold));
    }
    if (data.email_notifications !== undefined) {
      fields.push('email_notifications = ?');
      values.push(data.email_notifications ? 1 : 0);
    }
    if (data.renewal_reminder_days !== undefined) {
      fields.push('renewal_reminder_days = ?');
      values.push(Number(data.renewal_reminder_days));
    }
    if (data.theme !== undefined) {
      fields.push('theme = ?');
      values.push(data.theme);
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(userId);
      this.db.prepare(`UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
    }

    return this.getPreferences(userId);
  }
}
