import React from "react";

const Loading = ({ height = "100vh" }) => {
  return (
    <div
      style={{ height, width: "100%", position: "absolute", left: 0, right: 0 }}
      className="flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Loading...
        </span>
      </div>
    </div>
  );
};

export default Loading;
