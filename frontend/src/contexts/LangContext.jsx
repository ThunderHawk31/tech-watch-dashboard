import { createContext, useContext, useState } from "react";

const LangContext = createContext({ lang: 'fr', setLang: () => {} });

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState('fr');
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
