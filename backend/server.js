const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config({ path: path.resolve(__dirname, ".env") });

connectDB();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

// Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`🚀 Server started on PORT ${PORT}`)
);

// -------------------- SOCKET.IO --------------------
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: false,
  },
});

console.log("🔌 Socket.IO server initialized, waiting for connections...");

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);
  console.log("👥 Total connected clients:", io.engine.clientsCount);

  let currentUser = null; // Save user info globally per socket

  socket.on("setup", (userData) => {
    currentUser = userData;
    if (userData && userData._id) {
      socket.join(userData._id);
      console.log("🏠 User joined personal room:", userData._id);
      socket.emit("connected");
    } else {
      console.log("❌ Invalid user data in setup:", userData);
    }
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("🏠 User joined chat room:", room);
  });

  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
  });

  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
  });

  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;

    if (!chat.users) {
      console.log("❌ chat.users not defined");
      return;
    }

    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.off("setup", () => {
    console.log("🧹 User disconnected from setup");
    if (currentUser && currentUser._id) {
      socket.leave(currentUser._id);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Client disconnected:", socket.id, "Reason:", reason);
  });
});
