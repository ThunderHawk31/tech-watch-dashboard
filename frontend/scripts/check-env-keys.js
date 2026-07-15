#!/usr/bin/env node
// Bloque le build si une variable publique (REACT_APP_ pour ce repo,
// NEXT_PUBLIC_ si ce script est réutilisé sur un projet Next.js) contient
// un secret Supabase privé : JWT legacy service_role, ou nouvelle clé sb_secret_.
//
// Deux sources vérifiées :
// 1. process.env — attrape les variables injectées par la plateforme (ex: Vercel dashboard)
// 2. fichiers .env* locaux — attrape une clé mal collée dans un .env avant même
//    que craco/react-scripts ne les charge dans son propre process.

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const PUBLIC_PREFIXES = ['REACT_APP_', 'NEXT_PUBLIC_'];

function decodeJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function leakedSecretReason(value) {
  if (typeof value !== 'string') return null;
  if (value.startsWith('sb_secret_')) return 'clé sb_secret_';
  if (value.startsWith('eyJ')) {
    const payload = decodeJwtPayload(value);
    if (payload && payload.role === 'service_role') return 'JWT service_role';
  }
  return null;
}

function isPublicKey(key) {
  return PUBLIC_PREFIXES.some(p => key.startsWith(p));
}

const offenders = [];

// 1. Variables déjà présentes dans l'environnement du process (CI, Vercel, shell...)
for (const [key, value] of Object.entries(process.env)) {
  const reason = isPublicKey(key) ? leakedSecretReason(value) : null;
  if (reason) offenders.push(`${key} — ${reason} (process.env)`);
}

// 2. Fichiers .env* du dossier frontend
const root = path.join(__dirname, '..');
const envFiles = ['.env', '.env.local', '.env.development', '.env.development.local',
  '.env.production', '.env.production.local', '.env.test', '.env.test.local']
  .map(f => path.join(root, f))
  .filter(fs.existsSync);

for (const file of envFiles) {
  // Parse avec le même package dotenv que craco/react-scripts utilise en
  // interne (config/env.js), pour éviter tout écart d'interprétation entre
  // ce garde-fou et ce qui sera réellement chargé dans le bundle.
  const parsed = dotenv.parse(fs.readFileSync(file));
  for (const [key, value] of Object.entries(parsed)) {
    const reason = isPublicKey(key) ? leakedSecretReason(value) : null;
    if (reason) offenders.push(`${key} — ${reason} (${path.basename(file)})`);
  }
}

if (offenders.length > 0) {
  console.error('\n🔴 BUILD BLOQUÉ : secret Supabase privé détecté dans une variable publique.');
  console.error('   Ces variables sont bundlées dans le JS client et seraient exposées publiquement.');
  console.error('   Occurrences : ' + offenders.join(', '));
  console.error('   → Utilise la clé publique (anon / sb_publishable_), jamais le secret.\n');
  process.exit(1);
}

console.log('✅ check-env : aucun secret exposé dans les variables publiques');
