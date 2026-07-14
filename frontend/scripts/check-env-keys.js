#!/usr/bin/env node
// Bloque le build si une variable REACT_APP_* (donc bundlée côté client)
// contient un JWT Supabase avec role=service_role.
//
// Deux sources vérifiées :
// 1. process.env — attrape les variables injectées par la plateforme (ex: Vercel dashboard)
// 2. fichiers .env* locaux — attrape une clé mal collée dans un .env avant même
//    que craco/react-scripts ne les charge dans son propre process.

const fs = require('fs');
const path = require('path');

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function isServiceRole(value) {
  if (typeof value !== 'string' || !value.startsWith('eyJ')) return false;
  const payload = decodeJwtPayload(value);
  return !!payload && payload.role === 'service_role';
}

const offenders = [];

// 1. Variables déjà présentes dans l'environnement du process (CI, Vercel, shell...)
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith('REACT_APP_') && isServiceRole(value)) {
    offenders.push(`${key} (process.env)`);
  }
}

// 2. Fichiers .env* du dossier frontend
const root = path.join(__dirname, '..');
const envFiles = ['.env', '.env.local', '.env.development', '.env.development.local',
  '.env.production', '.env.production.local', '.env.test', '.env.test.local']
  .map(f => path.join(root, f))
  .filter(fs.existsSync);

for (const file of envFiles) {
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*(REACT_APP_\w+)\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    const value = m[2].trim().replace(/^["']|["']$/g, '');
    if (isServiceRole(value)) {
      offenders.push(`${m[1]} (${path.basename(file)})`);
    }
  }
}

if (offenders.length > 0) {
  console.error('\n🔴 BUILD BLOQUÉ : clé Supabase service_role détectée dans une variable REACT_APP_*.');
  console.error('   Ces variables sont bundlées dans le JS client et seraient exposées publiquement.');
  console.error('   Occurrences : ' + offenders.join(', '));
  console.error('   → Utilise la clé "anon" pour toute variable REACT_APP_*, jamais la service_role.\n');
  process.exit(1);
}

console.log('✅ check-env : aucune clé service_role exposée côté client');
