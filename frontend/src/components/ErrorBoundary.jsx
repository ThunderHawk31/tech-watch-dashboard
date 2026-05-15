import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary — attrape les erreurs JS non gérées dans l'arbre React
 * et affiche un fallback au lieu d'un écran blanc total.
 *
 * Doit être une class component (limite de l'API React getDerivedStateFromError).
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // En prod, on pourrait envoyer à Sentry / LogRocket ici
    console.error('[ErrorBoundary] Erreur capturée :', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDev = process.env.NODE_ENV === 'development';

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icône */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-12 h-12 text-red-400" />
            </div>
          </div>

          {/* Message principal */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Quelque chose s'est mal passé
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Une erreur inattendue a empêché l'affichage de cette page.
              Rechargez la page ou revenez à l'accueil.
            </p>
          </div>

          {/* Stack trace en dev uniquement */}
          {isDev && this.state.error && (
            <details className="text-left bg-slate-900 rounded-lg p-4 border border-red-500/20">
              <summary className="text-xs font-mono text-red-400 cursor-pointer mb-2 select-none">
                Détails de l'erreur (dev only)
              </summary>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words overflow-auto max-h-48">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg
                         bg-primary text-primary-foreground font-medium text-sm
                         hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Recharger la page
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg
                         border border-border text-foreground font-medium text-sm
                         hover:bg-muted transition-colors"
            >
              <Home className="w-4 h-4" />
              Accueil
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
