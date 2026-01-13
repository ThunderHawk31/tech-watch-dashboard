const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const sourceIcon = path.join(__dirname, 'icones', 'vrai icones projet .png');
const outputDir = path.join(__dirname, 'frontend', 'public', 'icons');

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Tailles d'icônes à générer
const iconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

// Fonction pour générer une icône
async function generateIcon(size, name) {
  try {
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(outputDir, name));
    console.log(`✓ Généré: ${name} (${size}x${size})`);
  } catch (error) {
    console.error(`✗ Erreur lors de la génération de ${name}:`, error.message);
  }
}

// Générer toutes les icônes
async function generateAllIcons() {
  console.log('🚀 Génération des icônes en cours...\n');

  for (const icon of iconSizes) {
    await generateIcon(icon.size, icon.name);
  }

  // Copier l'icône principale comme favicon.ico (en 32x32)
  try {
    await sharp(sourceIcon)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(__dirname, 'frontend', 'public', 'favicon.ico'));
    console.log('✓ Généré: favicon.ico (32x32)');
  } catch (error) {
    console.error('✗ Erreur lors de la génération de favicon.ico:', error.message);
  }

  console.log('\n✅ Génération terminée !');
  console.log(`📁 Les icônes sont dans: ${outputDir}`);
}

// Exécuter
generateAllIcons().catch(console.error);
