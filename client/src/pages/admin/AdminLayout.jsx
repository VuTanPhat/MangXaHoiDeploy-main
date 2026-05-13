import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Home,
  Shield,
  FolderKanban,
} from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import { useLanguage } from "../../context/languageUtils";
import ThemeToggle from "../../components/ThemeToggle";

const AdminLayout = () => {
  // eslint-disable-next-line no-unused-vars
  const { t } = useLanguage();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.value);

  const menuItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { path: "/admin/users", icon: Users, label: "Quản lý người dùng" },
    { path: "/admin/posts", icon: FileText, label: "Quản lý bài viết" },
    { path: "/admin/projects", icon: FolderKanban, label: "Quản lý dự án" },
  ];

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800 dark:text-white">
                Admin Panel
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PingUp Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>

          {/* Back to App */}
          <NavLink
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Về trang chủ</span>
          </NavLink>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={currentUser?.profile_picture || "/default-avatar.png"}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 dark:text-white truncate">
                {currentUser?.full_name}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                Admin
              </p>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
