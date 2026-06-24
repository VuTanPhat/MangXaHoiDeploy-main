/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import UserCard from "../components/UserCard";
import Loading from "../components/Loading";
import api from "../api/axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "../features/user/userSlice";
import { useLanguage } from "../context/languageUtils";

const Discover = () => {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const handleSearch = async (e) => {
    if (e.key === "Enter") {
      try {
        setUsers([]);
        setLoading(true);
        const { data } = await api.post(
          "/api/user/discover",
          { input },
          {
            headers: { Authorization: `Bearer ${await getToken()}` },
          }
        );
        data.success ? setUsers(data.users) : toast.error(data.message);
        setLoading(false);
        setInput("");
      } catch (error) {
        toast.error(error.message);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchUser(token));
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            {t("discoverPeople")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {t("connectWithPeople")}
          </p>
        </div>

        {/* Search */}
        <div className="mb-10 shadow-lg dark:shadow-slate-900 rounded-xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden transition-all duration-200">
          <div className="p-7">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="pl-12 py-3 w-full border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none max-sm:text-sm bg-white dark:bg-slate-700 dark:text-white dark:placeholder-slate-400 transition-colors duration-200"
                onChange={(e) => setInput(e.target.value)}
                value={input}
                onKeyUp={handleSearch}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
          {users.map((user) => (
            <div key={user._id} className="flex justify-center">
              <UserCard user={user} />
            </div>
          ))}
        </div>

        {loading && <Loading height="60vh" />}
      </div>
    </div>
  );
};

export default Discover;
