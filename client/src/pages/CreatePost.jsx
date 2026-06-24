/* eslint-disable no-unused-vars */

import React, { useState } from "react";
import { Image, X } from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/languageUtils";

const CreatePost = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = useSelector((state) => state.user.value);

  const { getToken } = useAuth();

  const handleSubmit = async () => {
    if (!images.length && !content) {
      return toast.error("Please add at least one image or text");
    }
    setLoading(true);

    const postType =
      images.length && content
        ? "text_with_image"
        : images.length
        ? "image"
        : "text";

    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("post_type", postType);
      images.map((image) => {
        formData.append("images", image);
      });

      const { data } = await api.post("/api/post/add", formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        navigate("/");
      } else {
        console.log(data.message);
        throw new Error(data.message);
      }
    } catch (error) {
      console.log(error.message);
      throw new Error(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-3xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
            {t("createPost")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {t("shareThoughts")}
          </p>
        </div>

        {/* Form */}
        <div className="max-w-2xl bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-slate-900 space-y-5 border border-blue-100 dark:border-slate-700">
          {/* Header */}
          <div className="flex items-center gap-4">
            <img
              src={user.profile_picture}
              alt=""
              className="w-14 h-14 rounded-full shadow-md ring-2 ring-indigo-200 dark:ring-indigo-600/30 object-cover"
            />
            <div>
              <h2 className="font-bold text-lg dark:text-white">
                {user.full_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                @{user.username}
              </p>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            className="w-full resize-none max-h-32 text-base outline-none placeholder-gray-400 dark:placeholder-slate-500 bg-slate-50 dark:bg-slate-700/50 dark:text-white rounded-xl p-4 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors duration-200"
            placeholder={t("whatsHappening")}
            onChange={(e) => setContent(e.target.value)}
            value={content}
          />

          {/* Images */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {images.map((image, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    className="h-20 rounded-md"
                    alt=""
                  />
                  <div
                    onClick={() =>
                      setImages(images.filter((_, index) => index !== i))
                    }
                    className="absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer"
                  >
                    <X className="w-6 h-6 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-300 dark:border-slate-600">
            <label
              htmlFor="images"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer"
            >
              <Image className="size-6" />
            </label>

            <input
              type="file"
              id="images"
              accept="image/*"
              hidden
              multiple
              onChange={(e) => setImages([...images, ...e.target.files])}
            />

            <button
              disabled={loading}
              onClick={() =>
                toast.promise(handleSubmit(), {
                  loading: "uploading ...",
                  success: <p>Post Added </p>,
                  error: <p>{t("postNotAdded")}</p>,
                })
              }
              className="text-base bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition-all shadow-md hover:shadow-lg text-white font-bold px-8 py-2.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("publishPost")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
