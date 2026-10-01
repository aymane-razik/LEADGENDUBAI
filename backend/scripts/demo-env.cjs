const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const dotenv = require('dotenv');

const backendRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(backendRoot, '..');
const demoEnvPath = path.join(backendRoot, '.env.demo');
const demoExamplePath = path.join(backendRoot, 'demo.env.example');
const pidPath = path.join(backendRoot, '.demo-processes.json');

function ensureDemoEnv() {
  if (!fs.existsSync(demoEnvPath)) {
    const template = fs.readFileSync(demoExamplePath, 'utf8');
    const secret = () => crypto.randomBytes(32).toString('hex');
    const configured = template
      .replace('JWT_SECRET=generated-by-demo-env-script', `JWT_SECRET=${secret()}`)
      .replace('JWT_REFRESH_SECRET=generated-by-demo-env-script', `JWT_REFRESH_SECRET=${secret()}`)
      .replace('JWT_RESET_SECRET=generated-by-demo-env-script', `JWT_RESET_SECRET=${secret()}`)
      .replace('ENCRYPTION_KEY=generated-by-demo-env-script', `ENCRYPTION_KEY=${secret()}`);
    fs.writeFileSync(demoEnvPath, configured, { encoding: 'utf8', flag: 'wx' });
    console.log('Created backend/.env.demo with local-only credentials.');
  }

  const env = dotenv.parse(fs.readFileSync(demoEnvPath));
  const mongoUrl = new URL(env.MONGODB_URI || '');
  const databaseName = decodeURIComponent(mongoUrl.pathname.slice(1));
  const localHosts = new Set(['127.0.0.1', 'localhost', '::1']);
  if (!localHosts.has(mongoUrl.hostname) || databaseName !== 'dubai-realestate-demo') {
    throw new Error('Demo mode only accepts a local MongoDB URI for the isolated dubai-realestate-demo database.');
  }
  if (!localHosts.has(env.REDIS_HOST || '')) {
    throw new Error('Demo mode only accepts a local Redis host.');
  }
  if (Number(env.REDIS_DB) !== 5) {
    throw new Error('Demo mode uses the isolated Redis database index 5.');
  }
  for (const [key, value] of Object.entries(env)) process.env[key] = value;
  process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
  process.env.DEMO_MODE = 'true';
  process.env.BACKEND_ORIGIN = 'http://localhost:5010';
  return env;
}

function run(mode) {
  const env = ensureDemoEnv();
  const entries = {
    api: { cwd: backendRoot, command: 'npm', args: ['run', 'dev'], port: 5010 },
    worker: { cwd: backendRoot, command: 'npm', args: ['run', 'dev:worker'] },
    frontend: { cwd: path.join(projectRoot, 'frontend'), command: 'npm', args: ['run', 'dev:demo'], port: 3010 },
    seed: { cwd: backendRoot, command: 'npm', args: ['run', 'seed:demo'] },
  };
  if (mode === 'infra') {
    const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'docker';
    const args = process.platform === 'win32'
      ? ['/d', '/s', '/c', 'docker compose -f docker-compose.demo.yml up -d mongodb redis']
      : ['compose', '-f', 'docker-compose.demo.yml', 'up', '-d', 'mongodb', 'redis'];
    const child = spawn(command, args, { cwd: projectRoot, stdio: 'inherit', windowsHide: true });
    child.on('exit', (code) => process.exit(code ?? 1));
    return;
  }
  const entry = entries[mode];
  if (!entry) throw new Error(`Unknown demo mode "${mode}". Use api, worker, frontend, seed, stop, or infra.`);
  if (entry.port) {
    const server = require('node:net').createServer();
    server.once('error', () => { throw new Error(`Demo port ${entry.port} is already occupied. Stop the demo using stop-demo.bat or update the demo launcher port.`); });
    server.listen(entry.port, '127.0.0.1', () => server.close());
    process.env.PORT = String(entry.port);
  }
  if (mode === 'frontend') {
    process.env.BACKEND_ORIGIN = `http://localhost:${env.PORT || 5010}`;
    process.env.NEXT_DIST_DIR = '.next-demo';
  }

  const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npm';
  const npmCommand = `npm ${entry.args.join(' ')}`;
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', npmCommand] : entry.args;
  const child = spawn(command, args, { cwd: entry.cwd, stdio: 'inherit', env: process.env, windowsHide: true });
  const processes = fs.existsSync(pidPath) ? JSON.parse(fs.readFileSync(pidPath, 'utf8')) : {};
  processes[mode] = process.pid;
  fs.writeFileSync(pidPath, JSON.stringify(processes, null, 2));
  const removePid = () => {
    try {
      const latest = JSON.parse(fs.readFileSync(pidPath, 'utf8'));
      delete latest[mode];
      if (Object.keys(latest).length) fs.writeFileSync(pidPath, JSON.stringify(latest, null, 2));
      else fs.rmSync(pidPath, { force: true });
    } catch { /* Process may exit after the demo state file has been removed. */ }
  };
  child.on('exit', (code) => { removePid(); process.exit(code ?? 0); });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
}

function stop() {
  if (!fs.existsSync(pidPath)) {
    console.log('No Dune demo processes are registered.');
    return;
  }
  const processes = JSON.parse(fs.readFileSync(pidPath, 'utf8'));
  if (process.platform === 'win32') {
    for (const [name, pid] of Object.entries(processes)) {
      const result = spawn('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { stdio: 'inherit', windowsHide: true });
      result.on('exit', () => console.log(`Stopped Dune demo ${name}.`));
    }
  } else {
    for (const [name, pid] of Object.entries(processes)) {
      try { process.kill(Number(pid), 'SIGTERM'); console.log(`Stopped Dune demo ${name}.`); } catch { /* Already stopped. */ }
    }
  }
  fs.rmSync(pidPath, { force: true });
}

try {
  const mode = process.argv[2] || 'help';
  if (mode === 'stop') stop();
  else if (mode === 'help') console.log('Usage: node scripts/demo-env.cjs <seed|api|worker|frontend|stop|infra>');
  else run(mode);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
