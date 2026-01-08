import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Link } from "react-router-dom";
import { ArrowLeft, Scale, Shield, Mail, User, FileText } from "lucide-react";

const MentionsLegales = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Bouton retour */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à l'accueil
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Scale className="w-8 h-8 text-primary" />
          Mentions Légales
        </h1>
        <p className="text-muted-foreground">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Contenu */}
      <div className="space-y-6">

        {/* 1. Éditeur du site */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Éditeur du site
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Nom :</strong> Nolan Macé</p>
            <p><strong>Statut :</strong> Étudiant en BTS SIO SISR (Services Informatiques aux Organisations)</p>
            <p><strong>Email :</strong> <a href="mailto:nolan.mace49@gmail.com" className="text-primary hover:underline">nolan.mace49@gmail.com</a></p>
            <p><strong>Site web :</strong> <a href="https://techwatch.fr" className="text-primary hover:underline">techwatch.fr</a></p>
          </CardContent>
        </Card>

        {/* 2. Hébergement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Hébergement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">Frontend</p>
              <p><strong>Hébergeur :</strong> Vercel Inc.</p>
              <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
              <p><strong>Site :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vercel.com</a></p>
            </div>

            <div>
              <p className="font-semibold mb-1">Backend & Automation</p>
              <p><strong>Hébergeur :</strong> Railway Corp.</p>
              <p><strong>Adresse :</strong> 2261 Market Street, San Francisco, CA 94114, USA</p>
              <p><strong>Site :</strong> <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">railway.app</a></p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Propriété intellectuelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Propriété intellectuelle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              L'ensemble du contenu de ce site (structure, textes, logos, images, éléments graphiques, code source)
              est la propriété exclusive de Nolan Macé, sauf mention contraire.
            </p>
            <p>
              Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces
              différents éléments est strictement interdite sans l'accord écrit de l'éditeur.
            </p>
            <p className="font-semibold mt-3">Technologies utilisées :</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>React (MIT License)</li>
              <li>Tailwind CSS (MIT License)</li>
              <li>shadcn/ui (MIT License)</li>
              <li>n8n (Fair-code License)</li>
              <li>Claude API (Anthropic)</li>
            </ul>
          </CardContent>
        </Card>

        {/* 4. Données personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Protection des données personnelles (RGPD)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-semibold">Collecte de données</p>
            <p>
              Ce site ne collecte aucune donnée personnelle identifiable. Aucun compte utilisateur n'est nécessaire
              pour consulter le contenu.
            </p>

            <p className="font-semibold mt-3">Données techniques</p>
            <p>
              Les seules données stockées sont :
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>localStorage</strong> : Favoris, préférences de thème (stockés localement dans votre navigateur)</li>
              <li><strong>Cookies techniques</strong> : Nécessaires au bon fonctionnement du site (PWA, cache)</li>
            </ul>

            <p className="font-semibold mt-3">Vos droits</p>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
              Les données étant stockées localement, vous pouvez les supprimer directement depuis les paramètres de votre navigateur.
            </p>

            <p className="font-semibold mt-3">Analytics et statistiques</p>
            <p>
              Ce site utilise des outils d'analytics pour mesurer l'audience et améliorer l'expérience utilisateur.
              Les données collectées sont anonymisées et utilisées uniquement à des fins statistiques.
              Aucune donnée personnelle identifiable n'est partagée avec des tiers.
            </p>
          </CardContent>
        </Card>

        {/* 5. Cookies */}
        <Card>
          <CardHeader>
            <CardTitle>Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Ce site utilise uniquement des cookies techniques strictement nécessaires au fonctionnement de l'application :
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Cache PWA</strong> : Permet le mode hors ligne</li>
              <li><strong>Préférences thème</strong> : Sauvegarde du mode clair/sombre</li>
              <li><strong>Favoris</strong> : Sauvegarde des articles favoris</li>
            </ul>
            <p className="mt-3">
              Aucun cookie tiers (réseaux sociaux, publicité, tracking) n'est utilisé.
            </p>
          </CardContent>
        </Card>

        {/* 6. Responsabilité */}
        <Card>
          <CardHeader>
            <CardTitle>Limitation de responsabilité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Les informations contenues sur ce site sont fournies à titre informatif et éducatif.
              L'éditeur s'efforce d'assurer l'exactitude et la mise à jour des informations, mais ne peut
              garantir l'exactitude, la précision ou l'exhaustivité des informations disponibles.
            </p>
            <p>
              Les analyses d'articles sont générées automatiquement par intelligence artificielle (Claude API)
              et peuvent comporter des erreurs ou des interprétations.
            </p>
            <p className="font-semibold mt-3">Sources externes</p>
            <p>
              Les liens vers des sites externes sont fournis à titre informatif. L'éditeur n'exerce aucun
              contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
            </p>
          </CardContent>
        </Card>

        {/* 7. Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Pour toute question concernant ces mentions légales, vous pouvez contacter :
            </p>
            <p>
              <strong>Email :</strong> <a href="mailto:nolan.mace49@gmail.com" className="text-primary hover:underline">nolan.mace49@gmail.com</a>
            </p>
            <p>
              <strong>LinkedIn :</strong> <a href="https://linkedin.com/in/nolan-macé-b8647738a" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Nolan Macé</a>
            </p>
            <p>
              <strong>GitHub :</strong> <a href="https://github.com/ThunderHawk31" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ThunderHawk31</a>
            </p>
          </CardContent>
        </Card>

        {/* 8. Loi applicable */}
        <Card>
          <CardHeader>
            <CardTitle>Loi applicable</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Les présentes mentions légales sont régies par le droit français.
              En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Footer de page */}
      <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
        <p>
          Projet de veille technologique automatisée développé par Nolan Macé.
        </p>
        <p className="mt-2">
          <Link to="/" className="text-primary hover:underline">
            Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
};

export default MentionsLegales;
