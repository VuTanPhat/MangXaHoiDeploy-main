/* eslint-disable no-unused-vars */

import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  MessageCircle,
  Search,
  UserIcon,
  Users,
  Bot,
  FolderKanban,
} from "lucide-react";
import { useLanguage } from "../context/languageUtils";

const MenuItems = ({ setSidebarOpen }) => {
  const { t } = useLanguage();

  const menuItemsData = [
    { to: "/", labelKey: "home", Icon: Home },
    { to: "/messages", labelKey: "messages", Icon: MessageCircle },
    // { to: "/projects", labelKey: "projects", Icon: FolderKanban },
    //{ to: "/ai-chat", labelKey: "aiChat", Icon: Bot },
    { to: "/connections", labelKey: "connections", Icon: Users },
    { to: "/discover", labelKey: "discover", Icon: Search },
    { to: "/profile", labelKey: "profile", Icon: UserIcon },
  ];

  return (
    <div className="px-4 text-gray-600 dark:text-slate-300 space-y-2 font-medium">
      {menuItemsData.map(({ to, labelKey, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `px-4 py-3 flex items-center gap-3 rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm"
                : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200"
            }`
          }
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">{t(labelKey)}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default MenuItems;
