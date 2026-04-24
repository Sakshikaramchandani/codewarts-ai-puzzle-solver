/* ============================================================
   CODEWARTS — app.js
   Main application logic: routing, auth, games, puzzles
   Depends on: database.js (CW_DB must be loaded first)
   ============================================================ */

/* ── App State ── */
const APP = {
  user:        null,
  currentGame: null,
  timer:       null,
  startTime:   null,
  moves:       0,
  nodes:       0,
  aiRunning:   false,
};

/* ── Game State (per session) ── */
let GS = {};

/* ── Puzzle Catalogue ── */
const PUZZLES = [
  { id: 'dijkstra', title: "Dijkstra's Pathfinding", algo: "Dijkstra's Algorithm",
    desc: 'Find the shortest enchanted path in a weighted graph.',
    diff: 'medium', icon: '🗺️', bg: 'rgba(20,10,40,.95)', type: 'grid' },
  { id: 'bfs', title: 'BFS Labyrinth', algo: 'Breadth-First Search',
    desc: 'Explore the Hogwarts labyrinth level by level.',
    diff: 'easy', icon: '🌊', bg: 'rgba(10,25,20,.95)', type: 'grid' },
  { id: 'dfs', title: 'DFS Maze of Secrets', algo: 'Depth-First Search',
    desc: 'Navigate deep into the dungeons before backtracking.',
    diff: 'easy', icon: '🔍', bg: 'rgba(10,20,10,.95)', type: 'grid' },
  { id: 'astar', title: '8 Puzzle — A* Search', algo: 'A* Heuristic Search',
    desc: 'Slide enchanted tiles using the cunning A* heuristic.',
    diff: 'hard', icon: '⭐', bg: 'rgba(25,20,5,.95)', type: 'grid' },
  { id: 'sudoku', title: 'Sudoku Conjuration', algo: 'Backtracking',
    desc: 'Fill the 9×9 magical grid — watch backtracking solve it.',
    diff: 'medium', icon: '🔢', bg: 'rgba(20,10,30,.95)', type: 'sudoku' },
  { id: 'nqueens', title: 'N-Queens Prophecy', algo: 'Backtracking / CSP',
    desc: 'Place N queens so none threaten each other.',
    diff: 'hard', icon: '👑', bg: 'rgba(20,15,5,.95)', type: 'nqueens' },
  { id: 'tictactoe', title: 'Tic Tac Toe Duel', algo: 'Minimax Algorithm',
    desc: 'Duel an unbeatable AI wizard powered by Minimax.',
    diff: 'easy', icon: '🎭', bg: 'rgba(25,8,25,.95)', type: 'tictactoe' },
  { id: 'waterjug', title: 'Water Jug Potion', algo: 'BFS State Search',
    desc: 'Brew exact potions — Easy / Medium / Hard levels!',
    diff: 'medium', icon: '🪣', bg: 'rgba(5,20,25,.95)', type: 'waterjug' },
];

/* ── Water Jug Problem Bank ── */
const WJ_PROBLEMS = {
  easy: [
    { jugs:[{cap:4,label:'A'},{cap:3,label:'B'}], target:2, name:'Classic 4 & 3 Jugs' },
    { jugs:[{cap:5,label:'A'},{cap:3,label:'B'}], target:4, name:'Measure 4L' },
    { jugs:[{cap:6,label:'A'},{cap:4,label:'B'}], target:2, name:'6 & 4 Jugs' },
    { jugs:[{cap:3,label:'A'},{cap:5,label:'B'}], target:1, name:'Get Exactly 1L' },
    { jugs:[{cap:8,label:'A'},{cap:5,label:'B'}], target:3, name:'8 & 5 Jugs' },
    { jugs:[{cap:7,label:'A'},{cap:3,label:'B'}], target:5, name:'Measure 5L' },
    { jugs:[{cap:9,label:'A'},{cap:4,label:'B'}], target:1, name:'9 & 4 Challenge' },
  ],
  medium: [
    { jugs:[{cap:5,label:'A'},{cap:3,label:'B'},{cap:8,label:'C'}], target:4, name:'Triple Cauldron I' },
    { jugs:[{cap:11,label:'A'},{cap:6,label:'B'},{cap:5,label:'C'}], target:9, name:'11-6-5 Challenge' },
    { jugs:[{cap:9,label:'A'},{cap:4,label:'B'}], target:6, name:'9 & 4 — Measure 6' },
    { jugs:[{cap:12,label:'A'},{cap:8,label:'B'},{cap:5,label:'C'}], target:7, name:'Triple Cauldron II' },
    { jugs:[{cap:10,label:'A'},{cap:6,label:'B'}], target:4, name:'10 & 6 Jugs' },
    { jugs:[{cap:7,label:'A'},{cap:5,label:'B'}], target:3, name:'7 & 5 Jugs' },
    { jugs:[{cap:13,label:'A'},{cap:5,label:'B'},{cap:3,label:'C'}], target:8, name:'Triple Medium III' },
  ],
  hard: [
    { jugs:[{cap:13,label:'A'},{cap:7,label:'B'},{cap:5,label:'C'}], target:11, name:'Dark Arts I' },
    { jugs:[{cap:14,label:'A'},{cap:9,label:'B'},{cap:6,label:'C'}], target:5,  name:'Dark Arts II' },
    { jugs:[{cap:15,label:'A'},{cap:10,label:'B'},{cap:6,label:'C'}], target:8, name:'Triple Dark I' },
    { jugs:[{cap:19,label:'A'},{cap:13,label:'B'},{cap:7,label:'C'}], target:11,name:'Dark Arts III' },
    { jugs:[{cap:12,label:'A'},{cap:7,label:'B'},{cap:5,label:'C'}], target:9,  name:'Triple Dark II' },
    { jugs:[{cap:17,label:'A'},{cap:11,label:'B'}], target:6,                   name:'17 & 11 Mega' },
    { jugs:[{cap:20,label:'A'},{cap:13,label:'B'},{cap:8,label:'C'}], target:14,name:'Grand Cauldron' },
  ],
};

function getRandProblem(level) {
  const pool = WJ_PROBLEMS[level] || WJ_PROBLEMS.easy;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ============================================================
   ROUTING / PAGE NAVIGATION
   ============================================================ */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  const pg = document.getElementById('page-' + name);
  if (pg) pg.classList.add('active');

  const nv = document.getElementById('nav-' + name);
  if (nv) nv.classList.add('active');

  if (name === 'dashboard') renderDashboard();
  if (name === 'home')      updateHeroStats();

  window.scrollTo(0, 0);
}

function toggleFaq(el) {
  el.parentElement.classList.toggle('open');
}

/* ── Hero live stats ── */
function updateHeroStats() {
  const el1 = document.getElementById('hs-users');
  const el2 = document.getElementById('hs-games');
  if (el1) el1.textContent = CW_DB.getUserCount();
  if (el2) el2.textContent = CW_DB.getTotalGameCount();
}

/* ============================================================
   AUTHENTICATION
   ============================================================ */
function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;

  const result = CW_DB.loginUser(email, pass);
  if (result.ok) {
    APP.user = result.user;
    CW_DB.setSession(result.user);
    updateNavAuth();
    notify('Welcome back, ' + result.user.name.split(' ')[0] + '! ⚡');
    showPage('dashboard');
  } else {
    notify(result.error, 'error');
  }
}

function handleSignup() {
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const house = document.getElementById('signup-house').value;
  const pass  = document.getElementById('signup-password').value;

  if (!name || !email || !pass) { notify('Complete all enrollment fields!', 'error'); return; }

  const indicator = document.getElementById('db-indicator');
  indicator.textContent = '💾 Saving wizard profile to database...';
  indicator.classList.add('show');

  // Simulate slight async save delay for UX feedback
  setTimeout(() => {
    const result = CW_DB.registerUser({ name, email, house, password: pass });
    if (result.ok) {
      APP.user = result.user;
      CW_DB.setSession(result.user);
      indicator.textContent = '✦ Profile saved to Codewarts Database!';
      setTimeout(() => {
        indicator.classList.remove('show');
        updateNavAuth();
        notify('Your letter has arrived, ' + result.user.name.split(' ')[0] + '! Welcome to Codewarts ⚡');
        showPage('dashboard');
      }, 900);
    } else {
      indicator.classList.remove('show');
      notify(result.error, 'error');
    }
  }, 600);
}

function logout() {
  APP.user = null;
  CW_DB.clearSession();
  updateNavAuth();
  notify('Farewell, young wizard');
  showPage('home');
}

function updateNavAuth() {
  const btn  = document.getElementById('nav-auth-btn');
  const name = document.getElementById('nav-user-name');
  if (APP.user) {
    btn.textContent  = 'Exit';
    const house = APP.user.house && APP.user.house !== 'Undecided' ? ' · ' + APP.user.house : '';
    name.textContent = APP.user.name.split(' ')[0] + house;
    name.style.display = 'block';
  } else {
    btn.textContent    = 'Enter';
    name.style.display = 'none';
  }
}

function checkSession() {
  const stored = CW_DB.getSession();
  if (stored) {
    const fresh = CW_DB.getUserById(stored.id);
    if (fresh) { APP.user = fresh; updateNavAuth(); }
    else        { CW_DB.clearSession(); }
  }
}

/* ============================================================
   PUZZLE CARDS
   ============================================================ */
function renderPuzzleCards(containerId, limit) {
  const c = document.getElementById(containerId);
  if (!c) return;
  const items = limit ? PUZZLES.slice(0, limit) : PUZZLES;
  c.innerHTML = items.map(p => `
    <div class="puzzle-card" onclick="launchGame('${p.id}')">
      <div class="pc-visual" style="background:${p.bg}">${p.icon}</div>
      <div class="pc-body">
        <div class="pc-algo">${p.algo}</div>
        <div class="pc-title">${p.title}</div>
        <div class="pc-desc">${p.desc}</div>
        <div class="pc-meta">
          <span class="difficulty diff-${p.diff}">${p.diff}</span>
          <span class="pc-play">Cast Spell →</span>
        </div>
      </div>
    </div>`).join('');
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
  if (!APP.user) { showPage('login'); return; }

  const house = APP.user.house && APP.user.house !== 'Undecided' ? ' of ' + APP.user.house : '';
  document.getElementById('dash-welcome').textContent = 'Welcome, ' + APP.user.name.split(' ')[0] + house + '!';

  const stats = CW_DB.getUserStats(APP.user.id);
  document.getElementById('ds-total').textContent  = stats.totalGames;
  document.getElementById('ds-best').textContent   = stats.bestEfficiency ? stats.bestEfficiency + '%' : '—';
  document.getElementById('ds-avg').textContent    = stats.avgTime ? stats.avgTime + 's' : '0s';
  document.getElementById('ds-streak').textContent = stats.streak;

  // Performance chart
  const games = CW_DB.getGamesByUser(APP.user.id, 10);
  const chart = document.getElementById('perf-chart');
  if (chart) {
    if (games.length) {
      chart.innerHTML = games.slice().reverse().map(g =>
        `<div class="chart-bar" style="height:${(g.efficiency||0)/100*52}px;flex:1" title="${g.efficiency||0}%"></div>`
      ).join('');
    } else {
      chart.innerHTML = '<span style="font-size:.75rem;color:var(--text3);font-style:italic">Cast spells to see your power chart</span>';
    }
  }

  // History table
  const tbody = document.getElementById('history-tbody');
  if (tbody) {
    if (games.length) {
      tbody.innerHTML = games.slice(0, 12).map(g => `
        <tr>
          <td style="font-family:'Cinzel',serif;font-size:.7rem;color:var(--gold2)">${g.game}</td>
          <td><span class="badge badge-blue">${g.algo}</span></td>
          <td><span class="badge badge-gold">${g.level}</span></td>
          <td>${g.time ? g.time.toFixed(1) + 's' : '—'}</td>
          <td><span class="badge badge-green">${g.efficiency}%</span></td>
          <td style="font-size:.7rem">${new Date(g.date).toLocaleDateString()}</td>
        </tr>`).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:2rem;font-style:italic;font-family:'Cinzel',serif">
        No spells cast yet.
        <a style="color:var(--gold);cursor:pointer" onclick="showPage('games')">Open the Spellbook!</a>
      </td></tr>`;
    }
  }
}

/* ============================================================
   NOTIFICATION TOAST
   ============================================================ */
let _notifTimer;
function notify(msg, type = 'ok') {
  const n = document.getElementById('notif');
  if (!n) return;
  n.textContent = msg;
  n.className = 'notif ' + (type === 'error' ? 'error ' : '') + 'show';
  clearTimeout(_notifTimer);
  _notifTimer = setTimeout(() => n.classList.remove('show'), 3500);
}

/* ============================================================
   GAME LAUNCHER
   ============================================================ */
function launchGame(id) {
  const puzzle = PUZZLES.find(p => p.id === id);
  if (!puzzle) return;

  APP.currentGame = puzzle;
  APP.moves = 0; APP.nodes = 0; APP.aiRunning = false;

  document.getElementById('game-title').textContent    = puzzle.icon + ' ' + puzzle.title;
  document.getElementById('game-subtitle').textContent = 'Spell of ' + puzzle.algo;

  stopTimer();
  updateStats();
  showPage('game');

  setTimeout(() => {
    const type = puzzle.type;
    if      (type === 'sudoku')   initSudoku();
    else if (type === 'nqueens')  initNQueens();
    else if (type === 'tictactoe') initTicTacToe();
    else if (type === 'waterjug') initWaterJug();
    else                          initGridGame(puzzle);
  }, 120);
}

/* ── Timer ── */
function startTimer() {
  if (APP.timer) return;
  APP.startTime = Date.now();
  APP.timer = setInterval(() => {
    const t = (Date.now() - APP.startTime) / 1000;
    const el = document.getElementById('timer-display');
    if (el) el.textContent = t.toFixed(1) + 's';
  }, 100);
}

function stopTimer() {
  clearInterval(APP.timer);
  APP.timer = null;
  return APP.startTime ? (Date.now() - APP.startTime) / 1000 : 0;
}

function updateStats() {
  const m = document.getElementById('moves-count');
  const n = document.getElementById('nodes-count');
  if (m) m.textContent = APP.moves;
  if (n) n.textContent = APP.nodes;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ============================================================
   GRID GAME (BFS / DFS / Dijkstra / A*)
   ============================================================ */
function initGridGame(puzzle) {
  document.getElementById('game-instruction').textContent =
    'Click adjacent cells to move from Start 🟢 to Goal 🏁. Use AI Summon to watch the algorithm animate.';

  const algoMap = {
    dijkstra: ['Dijkstra', 'BFS'],
    bfs:      ['BFS', 'DFS'],
    dfs:      ['DFS', 'BFS'],
    astar:    ['A*', 'Dijkstra'],
  };
  const algos = algoMap[puzzle.id] || ['BFS'];
  document.getElementById('algo-selector').innerHTML = algos
    .map((a, i) => `<button class="algo-btn${i === 0 ? ' active' : ''}" onclick="selAlgo(this,'${a}')">${a}</button>`)
    .join('');
  GS.selectedAlgo = algos[0];

  document.getElementById('game-controls').innerHTML = `
    <button class="ctrl-btn" onclick="newMap()">🔄 New Map</button>
    <button class="ctrl-btn" onclick="resetPath()">↩️ Reset</button>
    <button class="ctrl-btn" onclick="showHint()">💡 Hint</button>`;

  genGrid(8);
}

function selAlgo(el, algo) {
  document.querySelectorAll('.algo-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  GS.selectedAlgo = algo;
}

function genGrid(size) {
  let grid, start, goal, valid = false, att = 0;
  while (!valid && att < 60) {
    att++;
    grid = [];
    for (let r = 0; r < size; r++) {
      grid.push([]);
      for (let c = 0; c < size; c++) grid[r].push(Math.random() < 0.28 ? 'wall' : 'empty');
    }
    start = { r: 0, c: 0 };
    goal  = { r: size - 1, c: size - 1 };
    grid[0][0]          = 'start';
    grid[size-1][size-1] = 'goal';
    if (bfsCheck(grid, start, goal, size)) valid = true;
  }
  GS = { ...GS, grid, start, goal, size, userPath: [start], currentPos: start, solved: false, visitedSet: null, aiPath: null };
  stopTimer();
  APP.moves = 0; APP.nodes = 0;
  updateStats();
  const td = document.getElementById('timer-display');
  if (td) td.textContent = '0.0s';
  renderGrid();
  startTimer();
}

function bfsCheck(g, s, goal, n) {
  const q = [s], v = new Set([`${s.r},${s.c}`]);
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  while (q.length) {
    const { r, c } = q.shift();
    if (r === goal.r && c === goal.c) return true;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc, k = `${nr},${nc}`;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && !v.has(k) && g[nr][nc] !== 'wall') {
        v.add(k); q.push({ r: nr, c: nc });
      }
    }
  }
  return false;
}

function renderGrid() {
  const { grid, size, userPath, currentPos } = GS;
  const uSet = new Set(userPath.map(p => `${p.r},${p.c}`));
  const cont = document.getElementById('game-canvas');
  if (!cont) return;
  const cs = Math.min(44, Math.floor((cont.offsetWidth - 32) / size));
  let g = document.getElementById('gameGrid');
  if (!g) { g = document.createElement('div'); g.id = 'gameGrid'; cont.innerHTML = ''; cont.appendChild(g); }
  g.style.gridTemplateColumns = `repeat(${size},${cs}px)`;
  g.innerHTML = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.width = cs + 'px'; cell.style.height = cs + 'px';
      const t = grid[r][c], k = `${r},${c}`;
      const isCur = currentPos && currentPos.r === r && currentPos.c === c;
      if      (t === 'wall')  cell.classList.add('wall');
      else if (t === 'start') cell.classList.add('start');
      else if (t === 'goal')  cell.classList.add('goal');
      else if (isCur)         cell.classList.add('current');
      else if (uSet.has(k))   cell.classList.add('user-path');
      else if (GS.visitedSet && GS.visitedSet.has(k)) cell.classList.add('visited');
      else if (GS.aiPath && GS.aiPath.some(p => p.r === r && p.c === c)) cell.classList.add('path');
      else cell.classList.add('empty');
      if (t === 'start') cell.textContent = '🟢';
      if (t === 'goal')  cell.textContent = '🏁';
      cell.onclick = () => moveCell(r, c);
      g.appendChild(cell);
    }
  }
}

function moveCell(r, c) {
  if (GS.solved || APP.aiRunning) return;
  const { grid, currentPos, userPath } = GS;
  if (grid[r][c] === 'wall') return;
  if (Math.abs(r - currentPos.r) + Math.abs(c - currentPos.c) !== 1) return;
  GS.currentPos = { r, c };
  GS.userPath = [...userPath, { r, c }];
  APP.moves++; updateStats(); renderGrid();
  if (r === GS.goal.r && c === GS.goal.c) {
    GS.solved = true;
    const t = stopTimer();
    setTimeout(() => showResults(t), 300);
  }
}

function resetPath() {
  GS.userPath = [GS.start]; GS.currentPos = GS.start;
  GS.visitedSet = null; GS.aiPath = null;
  APP.moves = 0; APP.nodes = 0; updateStats(); renderGrid();
}

function newMap() {
  closeModal();
  APP.aiRunning = false;
  if (APP.currentGame && APP.currentGame.type === 'grid') genGrid(GS.size || 8);
  else if (APP.currentGame) launchGame(APP.currentGame.id);
}

/* ── AI Solve ── */
async function runAISolve() {
  if (APP.aiRunning) return;
  APP.aiRunning = true;
  document.getElementById('ai-solve-btn').textContent = '⏳ Summoning...';

  const algo = GS.selectedAlgo || 'BFS';
  const { grid, start, goal, size } = GS;
  GS.visitedSet = new Set(); GS.aiPath = null;

  let res;
  if      (algo === 'BFS')      res = algoBFS(grid, start, goal, size);
  else if (algo === 'DFS')      res = algoDFS(grid, start, goal, size);
  else if (algo === 'Dijkstra') res = algoDijkstra(grid, start, goal, size);
  else if (algo === 'A*')       res = algoAStar(grid, start, goal, size);
  else                          res = algoBFS(grid, start, goal, size);

  APP.nodes = res.visited.length; updateStats();
  for (const v of res.visited) {
    GS.visitedSet.add(`${v.r},${v.c}`);
    renderGrid();
    await sleep(25);
  }
  if (res.path.length) { GS.aiPath = res.path; renderGrid(); notify('Solved in ' + res.path.length + ' steps via ' + algo + ' ⚡'); }
  else                 notify('No path found in this enchanted maze!', 'error');

  APP.aiRunning = false;
  document.getElementById('ai-solve-btn').textContent = '✦ Summon AI';
}

function showHint() {
  const { grid, currentPos, goal, size } = GS;
  const { path } = algoBFS(grid, currentPos, goal, size);
  if (path && path.length > 1) notify('Hint: Move to row ' + (path[1].r + 1) + ', col ' + (path[1].c + 1));
}

/* ── Pathfinding Algorithms ── */
function algoBFS(g, s, goal, n) {
  const q = [[s]], v = new Set([`${s.r},${s.c}`]), vis = [];
  const d = [[-1,0],[1,0],[0,-1],[0,1]];
  while (q.length) {
    const path = q.shift(), { r, c } = path[path.length - 1];
    vis.push({ r, c });
    if (r === goal.r && c === goal.c) return { path, visited: vis };
    for (const [dr, dc] of d) {
      const nr = r+dr, nc = c+dc, k = `${nr},${nc}`;
      if (nr>=0 && nr<n && nc>=0 && nc<n && !v.has(k) && g[nr][nc]!=='wall') { v.add(k); q.push([...path, {r:nr,c:nc}]); }
    }
  }
  return { path: [], visited: vis };
}

function algoDFS(g, s, goal, n) {
  const st = [[s]], v = new Set([`${s.r},${s.c}`]), vis = [];
  const d = [[-1,0],[1,0],[0,-1],[0,1]];
  while (st.length) {
    const path = st.pop(), { r, c } = path[path.length - 1];
    vis.push({ r, c });
    if (r === goal.r && c === goal.c) return { path, visited: vis };
    for (const [dr, dc] of d) {
      const nr = r+dr, nc = c+dc, k = `${nr},${nc}`;
      if (nr>=0 && nr<n && nc>=0 && nc<n && !v.has(k) && g[nr][nc]!=='wall') { v.add(k); st.push([...path, {r:nr,c:nc}]); }
    }
  }
  return { path: [], visited: vis };
}

function algoDijkstra(g, s, goal, n) {
  const dist = {}, prev = {}, vis = new Set(), visited = [], key = p => `${p.r},${p.c}`;
  dist[key(s)] = 0;
  const pq = [{ cost: 0, r: s.r, c: s.c }];
  const d = [[-1,0],[1,0],[0,-1],[0,1]];
  while (pq.length) {
    pq.sort((a, b) => a.cost - b.cost);
    const { cost, r, c } = pq.shift(), k = key({ r, c });
    if (vis.has(k)) continue;
    vis.add(k); visited.push({ r, c });
    if (r === goal.r && c === goal.c) {
      const path = []; let cur = { r, c };
      while (cur) { path.unshift(cur); cur = prev[key(cur)]; }
      return { path, visited };
    }
    for (const [dr, dc] of d) {
      const nr = r+dr, nc = c+dc, nk = `${nr},${nc}`;
      if (nr>=0 && nr<n && nc>=0 && nc<n && !vis.has(nk) && g[nr][nc]!=='wall') {
        const ng = cost + 1;
        if (!dist[nk] || ng < dist[nk]) { dist[nk]=ng; prev[nk]={r,c}; pq.push({cost:ng,r:nr,c:nc}); }
      }
    }
  }
  return { path: [], visited };
}

function algoAStar(g, s, goal, n) {
  const h = p => Math.abs(p.r - goal.r) + Math.abs(p.c - goal.c);
  const key = p => `${p.r},${p.c}`;
  const open = [{ f: h(s), gv: 0, r: s.r, c: s.c }];
  const gMap = { [key(s)]: 0 }, prev = {}, vis = new Set(), visited = [];
  const d = [[-1,0],[1,0],[0,-1],[0,1]];
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const { gv, r, c } = open.shift(), k = key({ r, c });
    if (vis.has(k)) continue;
    vis.add(k); visited.push({ r, c });
    if (r === goal.r && c === goal.c) {
      const path = []; let cur = { r, c };
      while (cur) { path.unshift(cur); cur = prev[key(cur)]; }
      return { path, visited };
    }
    for (const [dr, dc] of d) {
      const nr = r+dr, nc = c+dc, nk = `${nr},${nc}`;
      if (nr>=0 && nr<n && nc>=0 && nc<n && !vis.has(nk) && g[nr][nc]!=='wall') {
        const ng = gv + 1;
        if (!gMap[nk] || ng < gMap[nk]) { gMap[nk]=ng; prev[nk]={r,c}; open.push({f:ng+h({r:nr,c:nc}),gv:ng,r:nr,c:nc}); }
      }
    }
  }
  return { path: [], visited };
}

/* ── Grid Results Modal ── */
function showResults(time) {
  const { grid, start, goal, size, userPath } = GS;
  const { path: opt } = algoBFS(grid, start, goal, size);
  const optimal = opt.length - 1, um = userPath.length - 1;
  const eff = optimal > 0 ? Math.round(Math.min(100, (optimal / um) * 100)) : 100;

  openResultModal({
    title:    '⚡ Spell Complete!',
    time, moves: um, optimal, eff,
    feedback: eff >= 95 ? "⚡ Outstanding! Philosopher's Path achieved!" :
              eff >= 80 ? '✦ Excellent spellwork — very efficient!' :
              eff >= 60 ? '🎓 Good attempt. Watch the AI path to improve.' :
                          '📜 Follow the AI path to discover the optimal route.',
  });

  GS.aiPath = opt; renderGrid();

  const pz = APP.currentGame;
  CW_DB.saveGame({
    userId:     APP.user ? APP.user.id : 'guest',
    game:       pz ? pz.title : 'Grid',
    algo:       pz ? pz.algo  : 'BFS',
    level:      '—',
    time, moves: um, optimal, efficiency: eff,
  });
}

/* ── Generic result modal ── */
function openResultModal({ title, time, moves, optimal, eff, feedback }) {
  document.getElementById('modal-title').textContent = title || '⚡ Spell Complete!';
  document.getElementById('r-time').textContent    = typeof time === 'number' ? time.toFixed(1) + 's' : time;
  document.getElementById('r-moves').textContent   = moves;
  document.getElementById('r-optimal').textContent = optimal;
  document.getElementById('r-eff').textContent     = eff + '%';
  document.getElementById('r-eff-pct').textContent = eff + '%';
  document.getElementById('r-feedback').textContent = feedback || '';
  const bar = document.getElementById('r-eff-bar');
  if (bar) { bar.style.width = '0%'; setTimeout(() => bar.style.width = eff + '%', 100); }
  document.getElementById('result-modal').style.display = 'block';
}

function closeModal(e) {
  if (!e || e.target === e.currentTarget) document.getElementById('result-modal').style.display = 'none';
}

/* ============================================================
   SUDOKU
   ============================================================ */
function initSudoku() {
  document.getElementById('game-instruction').textContent =
    'Fill the 9×9 enchanted grid. Each row, column, and 3×3 chamber must contain all nine sacred numbers.';
  document.getElementById('algo-selector').innerHTML = '<button class="algo-btn active">Backtracking</button>';
  document.getElementById('game-controls').innerHTML = `
    <button class="ctrl-btn" onclick="newSudoku()">🔄 New Puzzle</button>
    <button class="ctrl-btn primary" onclick="solveSudokuAI()">✦ AI Conjure</button>
    <button class="ctrl-btn" onclick="validateSudoku()">✅ Check</button>`;
  newSudoku();
}

function newSudoku() {
  GS.sudokuBase = buildSudoku();
  GS.sudokuGrid = GS.sudokuBase.map(r => [...r]);
  GS.selectedCell = null;
  stopTimer(); APP.moves = 0; APP.nodes = 0; updateStats();
  const td = document.getElementById('timer-display');
  if (td) td.textContent = '0.0s';
  renderSudoku();
  startTimer();
}

function buildSudoku() {
  const g = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillSudokuGrid(g);
  GS.sudokuGiven = Array.from({ length: 9 }, () => Array(9).fill(true));
  let rem = 40;
  while (rem > 0) {
    const r = Math.floor(Math.random() * 9), c = Math.floor(Math.random() * 9);
    if (GS.sudokuGiven[r][c]) { GS.sudokuGiven[r][c] = false; g[r][c] = 0; rem--; }
  }
  return g;
}

function fillSudokuGrid(g) {
  const empty = findSudokuEmpty(g);
  if (!empty) return true;
  const [r, c] = empty;
  const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
  for (const n of nums) {
    if (isSudokuValid(g, r, c, n)) {
      g[r][c] = n;
      if (fillSudokuGrid(g)) return true;
      g[r][c] = 0;
    }
  }
  return false;
}

function findSudokuEmpty(g) {
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (!g[r][c]) return [r, c];
  return null;
}

function isSudokuValid(g, r, c, n) {
  for (let i = 0; i < 9; i++) if (g[r][i] === n || g[i][c] === n) return false;
  const sr = Math.floor(r/3)*3, sc = Math.floor(c/3)*3;
  for (let i = sr; i < sr+3; i++) for (let j = sc; j < sc+3; j++) if (g[i][j] === n) return false;
  return true;
}

function renderSudoku() {
  const cont = document.getElementById('game-canvas');
  let el = document.getElementById('sudokuGrid');
  if (!el) { el = document.createElement('div'); el.id = 'sudokuGrid'; cont.innerHTML = ''; cont.appendChild(el); }
  el.innerHTML = '';
  for (let r = 0; r < 9; r++) {
    for (let cc = 0; cc < 9; cc++) {
      const cell = document.createElement('div');
      cell.className = 'sudoku-cell';
      const isGiven = GS.sudokuGiven && GS.sudokuGiven[r][cc];
      cell.classList.add(isGiven ? 'given' : 'empty-s');
      cell.textContent = GS.sudokuGrid[r][cc] || '';
      cell.style.borderRight  = (cc%3===2 && cc<8) ? '2px solid rgba(197,160,80,.4)' : '';
      cell.style.borderBottom = (r%3===2  && r<8)  ? '2px solid rgba(197,160,80,.4)' : '';
      if (!isGiven) {
        cell.onclick = () => {
          document.querySelectorAll('.sudoku-cell.selected').forEach(e => e.classList.remove('selected'));
          GS.selectedCell = { r, c: cc };
          cell.classList.add('selected');
        };
      }
      el.appendChild(cell);
    }
  }
  let np = document.getElementById('sudokuNumpad');
  if (!np) { np = document.createElement('div'); np.id = 'sudokuNumpad'; np.className = 'sudoku-numpad'; cont.appendChild(np); }
  np.innerHTML = [1,2,3,4,5,6,7,8,9,'✕']
    .map(n => `<button class="num-key" onclick="enterSudokuNum(${JSON.stringify(n)})">${n}</button>`)
    .join('');
}

function enterSudokuNum(n) {
  if (!GS.selectedCell) return;
  const { r, c } = GS.selectedCell;
  if (GS.sudokuGiven && GS.sudokuGiven[r][c]) return;
  GS.sudokuGrid[r][c] = n === '✕' ? 0 : n;
  APP.moves++; updateStats();
  renderSudoku();
}

async function solveSudokuAI() {
  const g = GS.sudokuBase.map(r => [...r]);
  APP.nodes = 0;
  await backtrackSudoku(g);
  GS.sudokuGrid = g;
  renderSudoku();
  const cells = document.querySelectorAll('.sudoku-cell');
  for (const cell of cells) { cell.classList.add('solved'); await sleep(12); }
  const t = stopTimer();
  notify('Backtracking conjuration complete! Nodes: ' + APP.nodes + ' ⚡');
  CW_DB.saveGame({ userId: APP.user?.id || 'guest', game: 'Sudoku', algo: 'Backtracking', level: '—', time: t, moves: APP.moves, optimal: 81, efficiency: 100 });
}

async function backtrackSudoku(g) {
  const empty = findSudokuEmpty(g);
  if (!empty) return true;
  const [r, c] = empty;
  for (let n = 1; n <= 9; n++) {
    APP.nodes++;
    if (isSudokuValid(g, r, c, n)) {
      g[r][c] = n;
      if (await backtrackSudoku(g)) return true;
      g[r][c] = 0;
    }
  }
  return false;
}

function validateSudoku() {
  const ok = !Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => GS.sudokuGrid[r][c]))
    .flat().some(v => !v);
  notify(ok ? '⚡ The grid is fully enchanted!' : 'Empty chambers remain — keep conjuring!', ok ? 'ok' : 'error');
}

/* ============================================================
   N-QUEENS
   ============================================================ */
function initNQueens() {
  const n = 6;
  document.getElementById('game-instruction').textContent =
    `Place ${n} queens on the enchanted board so that no two queens threaten each other.`;
  document.getElementById('algo-selector').innerHTML = '<button class="algo-btn active">Backtracking</button>';
  document.getElementById('game-controls').innerHTML = `
    <button class="ctrl-btn" onclick="newQueens()">🔄 Reset</button>
    <button class="ctrl-btn primary" onclick="solveQueensAI()">✦ AI Conjure</button>`;
  GS.n = n; GS.queens = [];
  renderQueens(); startTimer();
}

function newQueens() {
  GS.queens = []; renderQueens();
  stopTimer(); APP.moves = 0; updateStats();
  const td = document.getElementById('timer-display');
  if (td) td.textContent = '0.0s';
  startTimer();
}

function renderQueens() {
  const n = GS.n, q = GS.queens, cf = queensConflicts(q, n);
  const cont = document.getElementById('game-canvas');
  let g = document.getElementById('queensGrid');
  if (!g) { g = document.createElement('div'); g.id = 'queensGrid'; cont.innerHTML = ''; cont.appendChild(g); }
  g.style.gridTemplateColumns = `repeat(${n},46px)`;
  g.innerHTML = '';
  for (let r = 0; r < n; r++) {
    for (let cc = 0; cc < n; cc++) {
      const cell = document.createElement('div');
      cell.className = 'queen-cell ' + ((r+cc)%2 === 0 ? 'light' : 'dark');
      const hasQ = q.some(x => x.r===r && x.c===cc);
      const isConf = cf.has(`${r},${cc}`);
      if (hasQ) cell.textContent = '♛';
      if (isConf && hasQ) cell.classList.add('conflict');
      else if (hasQ) cell.classList.add('placed');
      cell.onclick = () => placeQueen(r, cc);
      g.appendChild(cell);
    }
  }
}

function queensConflicts(q, n) {
  const s = new Set();
  for (let i = 0; i < q.length; i++) for (let j = i+1; j < q.length; j++) {
    const a = q[i], b = q[j];
    if (a.r===b.r || a.c===b.c || Math.abs(a.r-b.r)===Math.abs(a.c-b.c)) {
      s.add(`${a.r},${a.c}`); s.add(`${b.r},${b.c}`);
    }
  }
  return s;
}

function placeQueen(r, c) {
  const idx = GS.queens.findIndex(q => q.r===r && q.c===c);
  if (idx >= 0) GS.queens.splice(idx, 1);
  else GS.queens.push({ r, c });
  APP.moves++; updateStats(); renderQueens();
  if (GS.queens.length === GS.n && queensConflicts(GS.queens, GS.n).size === 0) {
    const t = stopTimer();
    setTimeout(() => {
      notify('⚡ All ' + GS.n + ' queens placed by royal decree!');
      CW_DB.saveGame({ userId: APP.user?.id||'guest', game: 'N-Queens', algo: 'Backtracking', level: 'Hard', time: t, moves: APP.moves, optimal: GS.n, efficiency: 100 });
      openResultModal({ title: '👑 Queens Placed!', time: t, moves: APP.moves, optimal: GS.n, eff: 100, feedback: '⚡ Flawless placement! All queens reign without conflict.' });
    }, 200);
  }
}

async function solveQueensAI() {
  const n = GS.n, sols = [];
  await backtrackQueens([], n, sols);
  if (sols.length) {
    GS.queens = sols[0].map((c, r) => ({ r, c }));
    for (let i = 0; i < GS.queens.length; i++) { renderQueens(); await sleep(200); }
    notify('N-Queens solved by backtracking sorcery! ⚡');
  }
}

async function backtrackQueens(board, n, sols) {
  if (board.length === n) { sols.push([...board]); return; }
  const row = board.length;
  for (let col = 0; col < n; col++) {
    if (isQueenSafe(board, row, col)) {
      board.push(col);
      await backtrackQueens(board, n, sols);
      if (sols.length) return;
      board.pop();
    }
  }
}

function isQueenSafe(board, row, col) {
  for (let r = 0; r < row; r++) if (board[r]===col || Math.abs(board[r]-col)===Math.abs(r-row)) return false;
  return true;
}

/* ============================================================
   TIC TAC TOE (Minimax)
   ============================================================ */
function initTicTacToe() {
  document.getElementById('game-instruction').textContent =
    'You are X — duel the AI wizard. Minimax plays perfectly. Can you draw?';
  document.getElementById('algo-selector').innerHTML = '<button class="algo-btn active">Minimax</button>';
  document.getElementById('game-controls').innerHTML = '<button class="ctrl-btn" onclick="newTTT()">🔄 New Duel</button>';
  GS.tttBoard = Array(9).fill('');
  GS.tttActive = true;
  renderTTT(); startTimer();
}

function renderTTT() {
  const cont = document.getElementById('game-canvas');
  let g = document.getElementById('tttGrid');
  if (!g) { g = document.createElement('div'); g.id = 'tttGrid'; cont.innerHTML = ''; cont.appendChild(g); }
  g.innerHTML = '';
  GS.tttBoard.forEach((v, i) => {
    const cell = document.createElement('div');
    cell.className = 'ttt-cell' + (v ? ' filled' : '');
    if (v) cell.classList.add(v.toLowerCase());
    cell.textContent = v;
    cell.onclick = () => tttMove(i);
    g.appendChild(cell);
  });
  const w = tttCheckWin(GS.tttBoard);
  const gs = document.getElementById('game-status');
  if (gs) gs.textContent = w ? (w==='X'?'You Win! ⚡': w==='O'?'AI Wins!':'Draw!') : (GS.tttActive ? 'Your Move' : 'AI Thinking...');
}

function tttMove(i) {
  if (!GS.tttActive || GS.tttBoard[i]) return;
  GS.tttBoard[i] = 'X'; APP.moves++; updateStats(); renderTTT();
  const w = tttCheckWin(GS.tttBoard);
  if (w) { endTTT(w); return; }
  GS.tttActive = false; renderTTT();
  setTimeout(aiTTTMove, 420);
}

function aiTTTMove() {
  const best = minimaxTTT(GS.tttBoard, 'O');
  if (best.index >= 0) GS.tttBoard[best.index] = 'O';
  APP.nodes++; updateStats();
  const w = tttCheckWin(GS.tttBoard);
  if (w) { endTTT(w); return; }
  GS.tttActive = true; renderTTT();
}

function endTTT(w) {
  const t = stopTimer(); renderTTT();
  const eff = w==='X' ? 100 : w==='draw' ? 80 : 40;
  const msg = w==='X' ? 'Extraordinary! You defeated the Minimax Wizard! ⚡' :
              w==='O' ? "The AI's Minimax is unbreakable..." : 'A draw — Minimax honour satisfied!';
  setTimeout(() => {
    notify(msg);
    CW_DB.saveGame({ userId: APP.user?.id||'guest', game: 'Tic Tac Toe', algo: 'Minimax', level: 'Easy', time: t, moves: APP.moves, optimal: 5, efficiency: eff });
    openResultModal({ title: w==='X' ? '⚡ Victory!' : w==='O' ? '🤖 AI Wins' : '🤝 Draw!', time: t, moves: APP.moves, optimal: 5, eff, feedback: msg });
  }, 300);
}

function newTTT() {
  GS.tttBoard = Array(9).fill(''); GS.tttActive = true;
  stopTimer(); APP.moves = 0; APP.nodes = 0; updateStats();
  const td = document.getElementById('timer-display');
  if (td) td.textContent = '0.0s';
  renderTTT(); startTimer();
}

function tttCheckWin(b) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,c,d] of wins) if (b[a] && b[a]===b[c] && b[a]===b[d]) return b[a];
  if (b.every(v => v)) return 'draw';
  return null;
}

function minimaxTTT(board, player) {
  const w = tttCheckWin(board);
  if (w === 'O') return { score: 10 };
  if (w === 'X') return { score: -10 };
  if (w === 'draw') return { score: 0 };
  const moves = [];
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const nb = [...board]; nb[i] = player;
      const res = minimaxTTT(nb, player === 'O' ? 'X' : 'O');
      moves.push({ index: i, score: res.score });
    }
  }
  return moves.reduce((best, m) =>
    player === 'O' ? (m.score > best.score ? m : best) : (m.score < best.score ? m : best),
    { score: player === 'O' ? -Infinity : Infinity }
  );
}

/* ============================================================
   WATER JUG (Multi-Level, New Problems Every Time)
   ============================================================ */
function initWaterJug() {
  GS.wjLevel   = 'easy';
  GS.wjProblem = getRandProblem('easy');
  GS.wjState   = GS.wjProblem.jugs.map(() => 0);
  GS.wjSteps   = [];
  GS.wjOptimalSteps = 0;
  document.getElementById('algo-selector').innerHTML = '<button class="algo-btn active">BFS</button>';
  renderWaterJug();
  startTimer();
}

function setWJLevel(lv) {
  GS.wjLevel   = lv;
  GS.wjProblem = getRandProblem(lv);
  GS.wjState   = GS.wjProblem.jugs.map(() => 0);
  GS.wjSteps   = [];
  stopTimer(); APP.moves = 0; APP.nodes = 0; updateStats();
  const td = document.getElementById('timer-display');
  if (td) td.textContent = '0.0s';
  renderWaterJug();
  startTimer();
}

function newWJProblem() {
  GS.wjProblem = getRandProblem(GS.wjLevel || 'easy');
  GS.wjState   = GS.wjProblem.jugs.map(() => 0);
  GS.wjSteps   = [];
  stopTimer(); APP.moves = 0; APP.nodes = 0; updateStats();
  const td = document.getElementById('timer-display');
  if (td) td.textContent = '0.0s';
  renderWaterJug();
  startTimer();
  notify('New problem: ' + GS.wjProblem.name + ' ⚡');
}

function resetWJ() {
  GS.wjState = GS.wjProblem.jugs.map(() => 0);
  GS.wjSteps = [];
  APP.moves = 0; updateStats();
  renderWaterJug();
}

function renderWaterJug() {
  const cont = document.getElementById('game-canvas');
  const prob  = GS.wjProblem;
  const jugs  = prob.jugs;
  cont.innerHTML = '';

  // Level selector row
  const lvlRow = document.createElement('div');
  lvlRow.className = 'wj-level-select';
  lvlRow.innerHTML = ['easy','medium','hard'].map(lv =>
    `<button class="wj-lvl-btn ${lv}${GS.wjLevel===lv?' active':''}" onclick="setWJLevel('${lv}')">${lv.charAt(0).toUpperCase()+lv.slice(1)}</button>`
  ).join('') + `<button class="wj-lvl-btn" onclick="newWJProblem()">🔄 New Problem</button>`;
  cont.appendChild(lvlRow);

  // Problem badge
  const badge = document.createElement('div');
  badge.className = 'wj-problem-badge';
  badge.textContent = '✦ ' + prob.name + '  ·  Target: ' + prob.target + 'L';
  cont.appendChild(badge);

  document.getElementById('game-instruction').textContent =
    'Transfer between cauldrons to measure exactly ' + prob.target + 'L. ' +
    (jugs.length === 3 ? 'Three cauldrons — higher complexity!' : '');

  // Jugs display
  const jugDisplay = document.createElement('div');
  jugDisplay.className = 'jug-display';
  jugs.forEach((jug, i) => {
    const amount = GS.wjState[i] || 0;
    const pct = (amount / jug.cap) * 100;
    const wrap = document.createElement('div');
    wrap.className = 'jug-wrap';
    wrap.innerHTML = `
      <div class="jug-cap-label">Cap: ${jug.cap}L</div>
      <div class="jug-container" style="height:${Math.min(160, jug.cap * 16)}px">
        <div class="jug-water" style="height:${pct}%"></div>
      </div>
      <div class="jug-label">Jug ${jug.label}: ${amount}/${jug.cap}L</div>`;
    jugDisplay.appendChild(wrap);
  });
  cont.appendChild(jugDisplay);

  // Operation buttons
  const ops = document.createElement('div');
  ops.className = 'jug-ops';
  jugs.forEach((jug, i) => {
    const fb = document.createElement('button');
    fb.className = 'jug-op'; fb.textContent = 'Fill ' + jug.label;
    fb.onclick = () => wjOperation('fill', i);
    ops.appendChild(fb);
    const eb = document.createElement('button');
    eb.className = 'jug-op'; eb.textContent = 'Empty ' + jug.label;
    eb.onclick = () => wjOperation('empty', i);
    ops.appendChild(eb);
  });
  for (let i = 0; i < jugs.length; i++) {
    for (let j = 0; j < jugs.length; j++) {
      if (i !== j) {
        const tb = document.createElement('button');
        tb.className = 'jug-op';
        tb.textContent = jugs[i].label + '→' + jugs[j].label;
        tb.onclick = () => wjOperation('pour', i, j);
        ops.appendChild(tb);
      }
    }
  }
  cont.appendChild(ops);

  // Goal display
  const goal = document.createElement('div');
  goal.className = 'wj-goal-display';
  goal.innerHTML = '🎯 Brew exactly <strong>' + prob.target + 'L</strong> in any cauldron';
  cont.appendChild(goal);

  // Steps log
  const log = document.createElement('div');
  log.className = 'wj-steps-log';
  log.innerHTML = GS.wjSteps.slice(-6).map(s => `<div class="wj-step">→ ${s}</div>`).join('');
  cont.appendChild(log);

  document.getElementById('game-controls').innerHTML = `
    <button class="ctrl-btn" onclick="resetWJ()">↩️ Reset</button>
    <button class="ctrl-btn primary" onclick="solveWaterJugAI()">✦ AI Solve</button>`;
}

function wjOperation(op, from, to) {
  const { jugs } = GS.wjProblem;
  const state = [...GS.wjState];

  if (op === 'fill') {
    const was = state[from];
    state[from] = jugs[from].cap;
    GS.wjSteps.push(`Fill ${jugs[from].label}: ${was}→${state[from]}L`);
  } else if (op === 'empty') {
    const was = state[from];
    state[from] = 0;
    GS.wjSteps.push(`Empty ${jugs[from].label}: ${was}→0L`);
  } else if (op === 'pour') {
    const t = Math.min(state[from], jugs[to].cap - state[to]);
    if (t === 0) { notify('No room or already empty!', 'error'); return; }
    state[from] -= t; state[to] += t;
    GS.wjSteps.push(`${jugs[from].label}→${jugs[to].label}: poured ${t}L`);
  }

  GS.wjState = state;
  APP.moves++; updateStats();
  renderWaterJug();

  if (state.some(v => v === GS.wjProblem.target)) {
    const t = stopTimer();
    const lvl = GS.wjLevel || 'easy';
    const opt = GS.wjOptimalSteps || APP.moves;
    const eff = Math.round(Math.min(100, (opt / APP.moves) * 100));
    CW_DB.saveGame({
      userId: APP.user?.id || 'guest',
      game: 'Water Jug (' + GS.wjProblem.name + ')',
      algo: 'BFS State Search',
      level: lvl,
      time: t, moves: APP.moves, optimal: opt, efficiency: eff,
    });
    openResultModal({
      title: '🧪 Potion Brewed!',
      time: t, moves: APP.moves, optimal: opt, eff,
      feedback: eff >= 90 ? '⚡ Perfect brew! Optimal potion technique!' :
                eff >= 70 ? '✦ Good cauldron work — efficient brewing.' :
                '📜 Watch the AI solve it to discover the optimal steps.',
    });
  }
}

async function solveWaterJugAI() {
  const { jugs, target } = GS.wjProblem;
  const n = jugs.length;
  const startState = Array(n).fill(0);
  const key = s => s.join(',');
  const q = [[startState, []]], v = new Set([key(startState)]);
  let found = false;
  APP.nodes = 0;

  while (q.length && !found) {
    const [state, path] = q.shift();
    APP.nodes++; updateStats();

    const nextStates = [];
    jugs.forEach((jug, i) => {
      const s1 = [...state]; s1[i] = jug.cap; nextStates.push(s1);          // fill
      const s2 = [...state]; s2[i] = 0;         nextStates.push(s2);          // empty
      jugs.forEach((jug2, j) => {
        if (i !== j) {
          const t = Math.min(state[i], jug2.cap - state[j]);
          if (t > 0) { const s3 = [...state]; s3[i] -= t; s3[j] += t; nextStates.push(s3); }
        }
      });
    });

    for (const ns of nextStates) {
      const k = key(ns);
      if (!v.has(k)) {
        v.add(k);
        const np = [...path, ns];
        if (ns.some(x => x === target)) {
          GS.wjOptimalSteps = np.length;
          for (const step of np) {
            GS.wjState = step;
            renderWaterJug();
            await sleep(560);
          }
          notify('BFS solved in ' + np.length + ' optimal steps! ⚡');
          found = true; break;
        }
        q.push([ns, np]);
      }
    }
  }
  if (!found) notify('No solution found for this configuration!', 'error');
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function submitContact() {
  const name    = document.getElementById('contact-name').value.trim();
  const email   = document.getElementById('contact-email').value.trim();
  const subject = document.getElementById('contact-subject').value.trim();
  const message = document.getElementById('contact-msg').value.trim();

  const result = CW_DB.saveMessage({ name, email, subject, message });
  if (result.ok) {
    notify('Your owl has been dispatched to the Owlery! 🦉');
    ['contact-name','contact-email','contact-subject','contact-msg']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  } else {
    notify(result.error, 'error');
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderPuzzleCards('home-puzzle-grid', 6);
  renderPuzzleCards('all-puzzle-grid');
  checkSession();
  updateHeroStats();
});
