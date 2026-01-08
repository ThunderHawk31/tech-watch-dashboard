import { createContext, useContext } from "react";
import { useFavorites as useFavoritesHook } from '../hooks/useFavorites';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const favoritesManager = useFavoritesHook();

  return (
    <FavoritesContext.Provider value={favoritesManager}>
      {children}
    </FavoritesContext.Provider>
  );
};
