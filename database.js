/**
 * CODEWARTS DATABASE
 * ==================
 * Persistent client-side database using localStorage.
 * Schema:
 *   cw_users    → Array of user objects
 *   cw_games    → Array of game result objects
 *   cw_messages → Array of contact messages
 *   cw_meta     → Object with aggregate stats
 *
 * To connect a real backend, replace the localStorage calls
 * in each method with fetch() calls to your API endpoints.
 */

const CW_DB = (() => {

  /* ── Keys ── */
  const KEYS = {
    USERS:    'cw_users',
    GAMES:    'cw_games',
    MESSAGES: 'cw_messages',
    META:     'cw_meta',
    SESSION:  'cw_session',
  };

  /* ── Low-level helpers ── */
  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  }

  function readObj(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); }
    catch { return {}; }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
  }

  /* ── Meta / stats ── */
  function refreshMeta() {
    const meta = {
      totalUsers: read(KEYS.USERS).length,
      totalGames: read(KEYS.GAMES).length,
      totalMessages: read(KEYS.MESSAGES).length,
      lastUpdated: new Date().toISOString(),
    };
    write(KEYS.META, meta);
    return meta;
  }

  /* ════════════════════════════════════════
     USER OPERATIONS
  ════════════════════════════════════════ */

  /**
   * Register a new wizard.
   * @param {Object} data  { name, email, house, password }
   * @returns {{ ok: boolean, user?: Object, error?: string }}
   */
  function registerUser({ name, email, house, password }) {
    if (!name || !email || !password) {
      return { ok: false, error: 'All fields are required.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: 'Invalid email address.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    const users = read(KEYS.USERS);
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'This email is already registered.' };
    }

    const user = {
      id:          uid('usr'),
      name:        name.trim(),
      email:       email.trim().toLowerCase(),
      house:       house || 'Undecided',
      password,                       // In production: hash with bcrypt
      createdAt:   new Date().toISOString(),
      lastLogin:   new Date().toISOString(),
      totalGames:  0,
      bestEfficiency: 0,
    };

    users.push(user);
    write(KEYS.USERS, users);
    refreshMeta();

    // Return user WITHOUT password
    const { password: _p, ...safeUser } = user;
    return { ok: true, user: safeUser };
  }

  /**
   * Login an existing wizard.
   * @param {string} email
   * @param {string} password
   * @returns {{ ok: boolean, user?: Object, error?: string }}
   */
  function loginUser(email, password) {
    if (!email || !password) {
      return { ok: false, error: 'Email and password required.' };
    }

    // Built-in demo account
    if (email === 'demo@codewarts.com' && password === 'demo123') {
      ensureDemoUser();
    }

    const users = read(KEYS.USERS);
    const found = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!found) return { ok: false, error: 'Incorrect email or password.' };

    // Update last login
    found.lastLogin = new Date().toISOString();
    write(KEYS.USERS, users);
    refreshMeta();

    const { password: _p, ...safeUser } = found;
    return { ok: true, user: safeUser };
  }

  /**
   * Update a user record (does not overwrite password unless included).
   * @param {Object} updatedUser
   */
  function updateUser(updatedUser) {
    const users = read(KEYS.USERS);
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx < 0) return { ok: false, error: 'User not found.' };
    users[idx] = { ...users[idx], ...updatedUser };
    write(KEYS.USERS, users);
    const { password: _p, ...safeUser } = users[idx];
    return { ok: true, user: safeUser };
  }

  /**
   * Fetch a public (no-password) user record by ID.
   */
  function getUserById(id) {
    const found = read(KEYS.USERS).find(u => u.id === id);
    if (!found) return null;
    const { password: _p, ...safe } = found;
    return safe;
  }

  /**
   * Return total user count.
   */
  function getUserCount() {
    return read(KEYS.USERS).length;
  }

  /* ════════════════════════════════════════
     GAME / RESULT OPERATIONS
  ════════════════════════════════════════ */

  /**
   * Persist a completed game result.
   * @param {Object} data
   *   { userId, game, algo, level, time, moves, optimal, efficiency }
   * @returns {Object} saved record
   */
  function saveGame({ userId, game, algo, level, time, moves, optimal, efficiency }) {
    const record = {
      id:         uid('gam'),
      userId:     userId || 'guest',
      game:       game   || 'Unknown',
      algo:       algo   || '—',
      level:      level  || '—',
      time:       parseFloat((time  || 0).toFixed(2)),
      moves:      moves  || 0,
      optimal:    optimal || 0,
      efficiency: efficiency || 0,
      date:       new Date().toISOString(),
    };

    const games = read(KEYS.GAMES);
    games.push(record);
    write(KEYS.GAMES, games);

    // Update user aggregate stats
    if (userId && userId !== 'guest') {
      const users = read(KEYS.USERS);
      const uIdx  = users.findIndex(u => u.id === userId);
      if (uIdx >= 0) {
        users[uIdx].totalGames = (users[uIdx].totalGames || 0) + 1;
        if (efficiency > (users[uIdx].bestEfficiency || 0)) {
          users[uIdx].bestEfficiency = efficiency;
        }
        write(KEYS.USERS, users);
      }
    }

    refreshMeta();
    return record;
  }

  /**
   * Get all game records for a specific user, newest first.
   * @param {string} userId
   * @param {number} [limit]
   * @returns {Array}
   */
  function getGamesByUser(userId, limit) {
    const all = read(KEYS.GAMES)
      .filter(g => g.userId === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return limit ? all.slice(0, limit) : all;
  }

  /**
   * Get aggregate stats for a user: bestEfficiency, avgTime, totalGames, streak.
   */
  function getUserStats(userId) {
    const games = getGamesByUser(userId);
    if (!games.length) return { totalGames: 0, bestEfficiency: 0, avgTime: 0, streak: 0 };

    const effs = games.filter(g => g.efficiency > 0).map(g => g.efficiency);
    const avgTime = games.reduce((a, g) => a + (g.time || 0), 0) / games.length;

    // Streak = consecutive calendar days with at least one game
    const days = [...new Set(games.map(g => g.date.split('T')[0]))].sort().reverse();
    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (const day of days) {
      const d = new Date(day);
      const diff = Math.round((cursor - d) / 86400000);
      if (diff <= 1) { streak++; cursor = d; }
      else break;
    }

    return {
      totalGames:     games.length,
      bestEfficiency: effs.length ? Math.max(...effs) : 0,
      avgTime:        parseFloat(avgTime.toFixed(1)),
      streak,
    };
  }

  /**
   * Total games across all users.
   */
  function getTotalGameCount() {
    return read(KEYS.GAMES).length;
  }

  /* ════════════════════════════════════════
     CONTACT MESSAGES
  ════════════════════════════════════════ */

  /**
   * Save a contact message.
   */
  function saveMessage({ name, email, subject, message }) {
    if (!name || !email || !message) return { ok: false, error: 'Required fields missing.' };
    const msg = {
      id:      uid('msg'),
      name,
      email,
      subject: subject || '(no subject)',
      message,
      date:    new Date().toISOString(),
      read:    false,
    };
    const msgs = read(KEYS.MESSAGES);
    msgs.push(msg);
    write(KEYS.MESSAGES, msgs);
    refreshMeta();
    return { ok: true, message: msg };
  }

  /* ════════════════════════════════════════
     SESSION
  ════════════════════════════════════════ */

  function setSession(user) {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(KEYS.SESSION) || 'null'); }
    catch { return null; }
  }

  function clearSession() {
    localStorage.removeItem(KEYS.SESSION);
  }

  /* ════════════════════════════════════════
     SEED / HELPERS
  ════════════════════════════════════════ */

  function ensureDemoUser() {
    const users = read(KEYS.USERS);
    if (!users.find(u => u.email === 'demo@codewarts.com')) {
      users.push({
        id:             'usr_demo',
        name:           'Harry Codesworth',
        email:          'demo@codewarts.com',
        house:          'Gryffindor',
        password:       'demo123',
        createdAt:      '2025-01-01T00:00:00.000Z',
        lastLogin:      new Date().toISOString(),
        totalGames:     0,
        bestEfficiency: 0,
      });
      write(KEYS.USERS, users);
      refreshMeta();
    }
  }

  /**
   * Export entire DB as JSON string (for backup / debugging).
   */
  function exportDB() {
    return JSON.stringify({
      users:    read(KEYS.USERS).map(u => { const {password:_p,...s}=u; return s; }),
      games:    read(KEYS.GAMES),
      messages: read(KEYS.MESSAGES),
      meta:     readObj(KEYS.META),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Wipe all data (use with caution).
   */
  function resetDB() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }

  /* ── Init on load ── */
  ensureDemoUser();
  refreshMeta();

  /* ── Public API ── */
  return {
    registerUser,
    loginUser,
    updateUser,
    getUserById,
    getUserCount,
    saveGame,
    getGamesByUser,
    getUserStats,
    getTotalGameCount,
    saveMessage,
    setSession,
    getSession,
    clearSession,
    exportDB,
    resetDB,
  };

})();
