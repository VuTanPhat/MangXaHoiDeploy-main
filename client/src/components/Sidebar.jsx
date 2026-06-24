/* eslint-disable no-unused-vars */
import React from "react";
import { assets, dummyUserData } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import MenuItems from "./MenuItems";
import { CirclePlus, LogOut, Moon, Sun, Globe, Shield } from "lucide-react";
import { UserButton, useClerk } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/languageUtils";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const { signOut } = useClerk();
  const { isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <div
      className={`w-60 xl:w-72 flex-shrink-0 bg-blue-50 dark:bg-slate-900 border-r border-blue-200 dark:border-slate-700 shadow-lg dark:shadow-xl flex flex-col justify-between items-center max-sm:absolute top-0 bottom-0 z-20 ${
        sidebarOpen ? "translate-x-0" : "max-sm:-translate-x-full"
      } transition-all duration-300 ease-in-out`}
    >
      <div className="w-full">
        <div className="flex items-center justify-between px-6 py-4">
          <img
            onClick={() => navigate("/")}
            src={assets.logo}
            className="w-28 cursor-pointer dark:brightness-110 hover:scale-105 transition-transform"
            alt=""
          />
          <div className="flex items-center gap-2">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200"
              title={t("language")}
            >
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {language === "vi" ? "VI" : "EN"}
              </span>
            </button>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md hover:bg-yellow-50 dark:hover:bg-slate-700 transition-all duration-200"
              title={isDark ? t("lightMode") : t("darkMode")}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-yellow-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          </div>
        </div>
        <hr className="border-blue-200 dark:border-slate-700 mb-4" />

        <MenuItems setSidebarOpen={setSidebarOpen} />

        <Link
          to="/create-post"
          className="flex items-center justify-center gap-2 py-3 mt-4 mx-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 transition-all shadow-md hover:shadow-lg text-white cursor-pointer font-semibold"
        >
          <CirclePlus className="w-5 h-5" />
          {t("createPost")}
        </Link>

        {/* Admin Panel Link - Only show for admin users */}
        {user?.role === "admin" && (
          <Link
            to="/admin"
            className="flex items-center justify-center gap-2 py-3 mt-2 mx-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:scale-95 transition-all shadow-md hover:shadow-lg text-white cursor-pointer font-semibold"
          >
            <Shield className="w-5 h-5" />
            Admin Panel
          </Link>
        )}
      </div>

      <div className="w-full border-t border-gray-200 dark:border-slate-700 p-4 px-7 flex items-center justify-between">
        <div className="flex gap-2 items-center cursor-pointer">
          <UserButton />
          <div>
            <h1 className="text-sm font-medium dark:text-white">
              {user.full_name}
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              @{user.username}
            </p>
          </div>
        </div>
        <LogOut
          onClick={signOut}
          className="w-4.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition cursor-pointer"
        />
      </div>
    </div>
  );
};

export default Sidebar;
