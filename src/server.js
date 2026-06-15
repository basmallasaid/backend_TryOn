require("dotenv").config();

const { app, seedAdminUser } = require("./app");
const notificationRoutes = require("./routes/notificationRoutes");
const avatarRoutes = require("./routes/avatarRoutes");
const connectDB = require("./config/db");
const { startScheduler } = require("./services/notificationScheduler");

(async () => {
  await connectDB();
  await seedAdminUser();
  startScheduler();

  app.use("/api/notifications", notificationRoutes);
  app.use("/api/avatars", avatarRoutes);

  app.get("/", (req, res) => {
    res.send("TryOn Professional Backend is Online");
  });

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
