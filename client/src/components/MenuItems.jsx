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
    <div className="px-6 text-gray-600 dark:text-slate-300 space-y-1 font-medium">
      {menuItemsData.map(({ to, labelKey, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `px-3.5 py-2 flex items-center gap-3 rounded-xl ${
              isActive
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                : "hover:bg-gray-50 dark:hover:bg-slate-800"
            }`
          }
        >
          <Icon className="w-5 h-5" />
          {t(labelKey)}
        </NavLink>
      ))}
    </div>
  );
};

export default MenuItems;
