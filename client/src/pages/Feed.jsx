import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";
import RecentMessages from "../components/RecentMessages";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useLanguage } from "../context/languageUtils";

const Feed = () => {
  const { t } = useLanguage();
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/post/feed", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setFeeds(data.posts);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeeds();
  }, []);

  return !loading ? (
    <div className="h-full overflow-y-scroll no-scrollbar py-8 xl:py-12 xl:pr-8 flex items-start justify-center xl:gap-8">
      {/* Stories and post list */}
      <div>
        <StoriesBar />
        <div className="p-4 space-y-5 mt-4">
          {feeds.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="max-xl:hidden sticky top-0 h-screen overflow-y-auto no-scrollbar py-8">
        <div className="max-w-xs bg-white dark:bg-slate-800 text-xs p-5 rounded-xl shadow-md dark:shadow-slate-900 inline-flex flex-col gap-3">
          <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm">
            {t("sponsored")}
          </h3>
          <img
            src={assets.sponsored_img}
            className="w-75 h-50 rounded-lg object-cover"
            alt=""
          />
          <p className="text-slate-700 dark:text-slate-300 font-medium">Email marketing</p>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Supercharge your marketing with a powerful, easy-to-use platform
            built for results.
          </p>
        </div>
        <div className="mt-6">
          <RecentMessages />
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default Feed;
