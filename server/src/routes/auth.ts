import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import sql from '../db/connection';
import { requireAuth, signToken, AuthRequest } from '../middleware/auth';

const router = Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name = '' } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = uuid();
    const [user] = await sql`
      INSERT INTO users (id, email, password_hash, name)
      VALUES (${id}, ${email.toLowerCase().trim()}, ${password_hash}, ${name.trim()})
      RETURNING id, email, name, created_at
    `;

    // Create default settings
    await sql`
      INSERT INTO user_settings (id, user_id, name)
      VALUES (${uuid()}, ${id}, ${name.trim()})
    `;

    const token = signToken(id);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}`;
    const user = rows[0] as any;
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, created_at: user.created_at } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql`SELECT id, email, name, created_at FROM users WHERE id = ${req.userId}`;
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const settingsRows = await sql`SELECT * FROM user_settings WHERE user_id = ${req.userId}`;
    const settings = settingsRows[0] || {};

    res.json({ ...user, settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    const [user] = await sql`
      UPDATE users SET
        name = ${name ?? ''},
        email = ${email ? email.toLowerCase().trim() : sql`email`},
        updated_at = NOW()
      WHERE id = ${req.userId}
      RETURNING id, email, name, created_at
    `;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/auth/settings
router.put('/settings', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { capital_goal = 0, target_roi = 15, target_flip_days = 90, notifications_enabled = 1 } = req.body;

    const existing = await sql`SELECT id FROM user_settings WHERE user_id = ${req.userId}`;
    if (existing.length > 0) {
      const [settings] = await sql`
        UPDATE user_settings SET
          capital_goal = ${capital_goal},
          target_roi = ${target_roi},
          target_flip_days = ${target_flip_days},
          notifications_enabled = ${notifications_enabled},
          updated_at = NOW()
        WHERE user_id = ${req.userId}
        RETURNING *
      `;
      return res.json(settings);
    }

    const [settings] = await sql`
      INSERT INTO user_settings (id, user_id, capital_goal, target_roi, target_flip_days, notifications_enabled)
      VALUES (${uuid()}, ${req.userId}, ${capital_goal}, ${target_roi}, ${target_flip_days}, ${notifications_enabled})
      RETURNING *
    `;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
