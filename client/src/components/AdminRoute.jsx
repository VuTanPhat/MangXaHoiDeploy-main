import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useUser } from "@clerk/clerk-react";

const AdminRoute = ({ children }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const currentUser = useSelector((state) => state.user.value);

  // Đợi Clerk load xong
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Chưa đăng nhập
  if (!clerkUser) {
    return <Navigate to="/" replace />;
  }

  // Đợi user data từ Redux load xong
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Kiểm tra role admin
  if (currentUser.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Kiểm tra tài khoản có bị khóa không
  if (!currentUser.isActive) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
