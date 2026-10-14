import { render, screen, fireEvent } from '@testing-library/react';
import ArticleCard from '../ArticleCard';

jest.mock('../../contexts/LangContext', () => ({
  useLang: () => ({ lang: 'fr', setLang: jest.fn() })
}));
jest.mock('../../contexts/FavoritesContext', () => ({
  useFavorites: () => ({ isFavorite: () => false, toggleFavorite: jest.fn(() => true) })
}));
jest.mock('../../contexts/SourcesContext', () => ({
  useSources: () => [],
  getSourceInfo: () => null
}));
// ShareButton touche l'API Web Share / clipboard, hors sujet pour ces tests.
jest.mock('../ShareButton', () => ({
  ShareButton: () => <button>Partager</button>
}));

function makeArticle(overrides = {}) {
  return {
    id: 'abc-123',
    titre: 'Deezer lance un filtre anti-IA',
    titre_en: '',
    date: '2026-10-14T16:33:31.213+00:00',
    url: 'https://techcrunch.com/deezer',
    analyse: JSON.stringify({ resume: 'Deezer va filtrer la musique générée par IA avant fin 2026.' }),
    importance: 3,
    sentiment: 'Positif',
    actions: ['SPOT', 'AAPL'],
    secteur: 'Tech',
    ...overrides
  };
}

describe('ArticleCard', () => {
  it('affiche le secteur, le titre et le résumé de l\'article', () => {
    render(<ArticleCard article={makeArticle()} onOpenModal={jest.fn()} />);

    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('Deezer lance un filtre anti-IA')).toBeInTheDocument();
    expect(screen.getByText(/Deezer va filtrer la musique générée par IA/)).toBeInTheDocument();
  });

  it('ouvre la modale avec l\'article au clic sur la carte', () => {
    const onOpenModal = jest.fn();
    const article = makeArticle();
    render(<ArticleCard article={article} onOpenModal={onOpenModal} />);

    fireEvent.click(screen.getByTestId('article-card'));
    expect(onOpenModal).toHaveBeenCalledWith(article);
  });

  it('déclenche onTickerClick avec le ticker cliqué, sans ouvrir la modale', () => {
    const onOpenModal = jest.fn();
    const onTickerClick = jest.fn();
    render(<ArticleCard article={makeArticle()} onOpenModal={onOpenModal} onTickerClick={onTickerClick} />);

    fireEvent.click(screen.getByText('AAPL'));
    expect(onTickerClick).toHaveBeenCalledWith('AAPL');
    expect(onOpenModal).not.toHaveBeenCalled();
  });

  it('retombe sur un titre générique quand titre et analyse sont absents', () => {
    render(<ArticleCard article={makeArticle({ titre: '', analyse: '' })} onOpenModal={jest.fn()} />);
    expect(screen.getByText('Article de veille technologique')).toBeInTheDocument();
  });

  it('n\'affiche pas de bloc "Actions" quand l\'article n\'a aucun ticker', () => {
    render(<ArticleCard article={makeArticle({ actions: [] })} onOpenModal={jest.fn()} />);
    expect(screen.queryByText('Actions :')).not.toBeInTheDocument();
  });
});
