#!/usr/bin/env node

// scripts/prerender.js
//
// Génère des snapshots HTML statiques des pages publiques après le build
// CRA, pour que les bots (IA, moteurs de recherche) qui n'exécutent pas JS
// voient du vrai contenu au lieu d'une coquille vide.
//
// Fonctionnement : sert le dossier build/ en local, ouvre chaque route dans
// Puppeteer, attend que React ait fini de rendre, sauvegarde le HTML final
// dans build/<route>/index.html. Vercel sert ces fichiers statiques en
// priorité sur sa réécriture SPA automatique (le comportement normal de
// navigation client-side pour les vrais visiteurs n'est pas affecté).

// puppeteer-core + @sparticuz/chromium (pas le paquet `puppeteer` complet) :
// le Chromium embarqué par `puppeteer` a besoin de libs système
// (libnspr4.so...) absentes du conteneur de build Vercel — testé, ça
// plante au lancement avec "error while loading shared libraries". Le
// binaire de @sparticuz/chromium est compilé spécifiquement pour tourner
// sans ces dépendances sur Lambda/Vercel.
const puppeteer = require("puppeteer-core");
// Paquet publié en ESM ; require() le range sous .default via l'interop CJS.
const chromium = require("@sparticuz/chromium").default;
const httpServer = require("http-server");
const path = require("path");
const fs = require("fs");

const BUILD_DIR = path.join(__dirname, "..", "build");
const PORT = 45678;

// Sélecteur par défaut : <h1>/<main> existent dès le premier rendu React,
// avant même le chargement des données. Ne convient qu'aux pages sans
// fetch asynchrone (ex. /about). Les routes qui affichent un skeleton en
// attendant des données (articles, widgets) définissent leur propre
// `ready` ci-dessous, pointant vers un data-testid posé sur le contenu
// réel — sinon le snapshot capture le skeleton, pas le contenu.
const DEFAULT_READY_SELECTOR = "#root h1, #root main";

// Routes publiques à pré-rendre. Ajouter ici toute nouvelle page marketing.
const ROUTES = [
  {
    path: "/",
    out: "index.html",
    ready: '[data-testid="article-card"], [data-testid="no-articles"]',
  },
  { path: "/about", out: "about/index.html" },
  {
    path: "/tendances",
    out: "tendances/index.html",
    ready: '[data-testid="sector-heat-item"], [data-testid="sector-heat-empty"]',
  },
  {
    path: "/stats",
    out: "stats/index.html",
    ready: '[data-testid="stats-content"]',
  },
  {
    path: "/digest",
    out: "digest/index.html",
    ready: '[data-testid="digest-card"], [data-testid="no-digests"]',
  },
];

async function waitForReady(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 15000 });
  } catch {
    console.warn("  ⚠ sélecteur de rendu non trouvé, snapshot pris tel quel après le timeout");
  }
  // Laisse le temps aux requêtes async (Supabase) de finir.
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => {});
}

async function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error("build/ introuvable — lance ce script après `npm run build`, pas avant.");
    process.exit(1);
  }

  // Sans `proxy`, http-server sert les fichiers statiques tels quels : "/"
  // résout vers index.html, mais "/about" ou "/tendances" n'existent pas
  // encore sur disque à ce stade (ce sont des routes React Router) et
  // renvoient un 404 brut. Le proxy vers soi-même est l'astuce standard de
  // http-server pour retomber sur index.html (fallback SPA) sur tout chemin
  // non trouvé, comme le fait la réécriture SPA de Vercel en production.
  const server = httpServer.createServer({ root: BUILD_DIR, proxy: `http://localhost:${PORT}?` });
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Serveur local sur http://localhost:${PORT}`);

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      const url = `http://localhost:${PORT}${route.path}`;
      console.log(`Rendu de ${route.path}...`);

      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
      await waitForReady(page, route.ready || DEFAULT_READY_SELECTOR);

      const html = await page.content();
      const outPath = path.join(BUILD_DIR, route.out);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      console.log(`  ✓ écrit dans build/${route.out}`);

      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log("Prerender terminé.");
}

main().catch((err) => {
  console.error("Échec du prerender :", err);
  process.exit(1);
});
