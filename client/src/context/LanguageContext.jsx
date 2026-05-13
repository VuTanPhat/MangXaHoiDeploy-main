import { useState, useEffect } from "react";
import moment from "moment";
import "moment/locale/vi";
import { LanguageContext, translations } from "./languageUtils";

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("language");
      if (savedLang) return savedLang;
    }
    return "vi";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    moment.locale(language === "vi" ? "vi" : "en");
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "vi" ? "en" : "vi"));
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isVietnamese: language === "vi",
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
