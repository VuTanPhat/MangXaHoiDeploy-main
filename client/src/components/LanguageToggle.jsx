import { Globe } from "lucide-react";
import { useLanguage } from "../context/languageUtils";

const LanguageToggle = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={t("language")}
    >
      <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {language === "vi" ? "VI" : "EN"}
      </span>
    </button>
  );
};

export default LanguageToggle;
