import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      // Connect to socket server
      const socketInstance = io(
        import.meta.env.VITE_BASEURL || "http://localhost:4000",
        {
          transports: ["websocket", "polling"],
        }
      );

      socketInstance.on("connect", () => {
        console.log("Socket connected:", socketInstance.id);
        setIsConnected(true);

        // Register user with socket
        socketInstance.emit("user:join", user.id);
      });

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      // Listen for handover request notifications
      socketInstance.on("handover:request", (data) => {
        const { handover } = data;
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={handover.from_user.profile_picture}
                    alt=""
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {handover.from_user.full_name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      Đã bàn giao cho bạn: {handover.task.task_key}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    window.location.href = `/task/${handover.task._id}`;
                    toast.dismiss(t.id);
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                >
                  Xem
                </button>
              </div>
            </div>
          ),
          { duration: 10000 }
        );
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [user]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
