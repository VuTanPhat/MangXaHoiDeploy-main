/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Search,
  UserCheck,
  UserX,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  MoreVertical,
  Eye,
} from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import moment from "moment";
import { useLanguage } from "../../context/languageUtils";

const UserManagement = () => {
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, status]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pagination.currentPage,
          limit: 10,
          search,
          status,
        },
      });

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      toast.error(t("cannotLoadData"));
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchUsers();
  };

  const toggleUserStatus = async (userId) => {
    try {
      const token = await getToken();
      const { data } = await api.put(
        `/api/admin/user/${userId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, isActive: data.user.isActive } : u
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(t("cannotUpdateRole"));
    }
    setMenuOpenId(null);
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      const token = await getToken();
      const { data } = await api.put(
        `/api/admin/user/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(t("cannotUpdateRole"));
    }
    setMenuOpenId(null);
  };

  const deleteUser = async (userId) => {
    if (!window.confirm(t("confirmDeleteUser"))) {
      return;
    }

    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success(data.message);
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(t("cannotDeleteUser"));
    }
    setMenuOpenId(null);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          {t("userManagement")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t("manageUsers")}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={t("searchUsers")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
            }}
            className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">{t("all")}</option>
            <option value="active">{t("active")}</option>
            <option value="blocked">{t("banned")}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {t("user")}
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Email
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {t("role")}
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {t("status")}
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {t("createdAt")}
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profile_picture || "/default-avatar.png"}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">
                              {user.full_name}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              {t("active")}
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" />
                              {t("banned")}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                        {moment(user.createdAt).format("DD/MM/YYYY")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 relative">
                          <button
                            onClick={() =>
                              setMenuOpenId(
                                menuOpenId === user._id ? null : user._id
                              )
                            }
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-slate-500" />
                          </button>

                          {/* Dropdown Menu */}
                          {menuOpenId === user._id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-10">
                              <button
                                onClick={() => toggleUserStatus(user._id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                              >
                                {user.isActive ? (
                                  <>
                                    <UserX className="w-4 h-4" />
                                    {t("banUser")}
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4" />
                                    {t("unbanUser")}
                                  </>
                                )}
                              </button>
                              {user.role !== "admin" && (
                                <button
                                  onClick={() =>
                                    changeUserRole(user._id, "admin")
                                  }
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                                >
                                  <Shield className="w-4 h-4" />
                                  {t("makeAdmin")}
                                </button>
                              )}
                              {user.role === "admin" && (
                                <button
                                  onClick={() =>
                                    changeUserRole(user._id, "user")
                                  }
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                                >
                                  <User className="w-4 h-4" />
                                  {t("makeUser")}
                                </button>
                              )}
                              <button
                                onClick={() => deleteUser(user._id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                {t("deleteUser")}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("showing")} {users.length} / {pagination.totalUsers}{" "}
                {t("users")}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage - 1,
                    }))
                  }
                  disabled={pagination.currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
                  {t("page")} {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: prev.currentPage + 1,
                    }))
                  }
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
