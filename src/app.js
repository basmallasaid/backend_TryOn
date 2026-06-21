const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
require("./config/passport");

const { extractKeys } = require("./middlewares/extractKeys");
const analyzeRoutes = require("./routes/analyzeRoutes");
const wardrobeRoutes = require("./routes/wardrobeRoutes");
const matchesRoutes = require("./routes/matchesRoutes");
const recommendationsRoutes = require("./routes/recommendationsRoutes");
const virtualTryOnRoutes = require("./routes/virtualTryOnRoutes");
const recycleRoutes = require("./routes/recycleRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const avatarRoutes = require("./routes/avatarRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const i18nMiddleware = require("./middlewares/i18nMiddleware");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const storeRoutes = require("./routes/storeRoutes");
const productRoutes = require("./routes/productRoutes");
const emailRoutes = require("./routes/emailRoutes");

const app = express();

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "TryOn API Docs",
  }),
);
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Middleware
app.use(cors());

// Webhook route must be before express.json() for raw body parsing
app.use("/api/webhooks", webhookRoutes);

app.use(express.json());
app.use(i18nMiddleware);
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

const User = require("./models/User");
const ApiKey = require("./models/ApiKey");
const AutomatedNotification = require("./models/AutomatedNotification");
const bcrypt = require("bcryptjs");
const { getEncryptedPassword } = require("./utils/adminPassword");

const seedAdminUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  try {
    const hash = await bcrypt.hash(getEncryptedPassword(), 10);
    const exists = await User.findOne({ email: adminEmail });
    if (!exists) {
      await User.create({
        email: adminEmail,
        password_hash: hash,
        role: "admin",
        auth_provider: "local",
        is_verified: true,
      });
      console.log(`[Seed] Admin user created: ${adminEmail}`);
    }
  } catch (e) {
    console.error("[Seed] Admin seed error:", e.message);
  }
};

// Seed default API keys if none exist
(async () => {
  try {
    const count = await ApiKey.countDocuments();
    if (count > 0) return;
    const defaults = [
      {
        name: "Recycle Analysis Model",
        service: "Recycle Analysis Model",
        key: process.env.HF_TOKEN || "",
        status: "Active",
      },
      {
        name: "Recycle Image Generation",
        service: "Recycle Image Generation",
        key: process.env.DASHSCOPE_API_KEY || "",
        status: "Active",
      },
      {
        name: "Try On Image Generation",
        service: "Try On Image Generation",
        key: process.env.KIE_API_key || "",
        status: "Active",
      },
      {
        name: "Try On Analysis Model",
        service: "Try On Analysis Model",
        key: process.env.HF_TOKEN || "",
        status: "Active",
      },
      {
        name: "Avatar Generation Model",
        service: "Avatar Generation Model",
        key: process.env.KIE_API_key || "",
        status: "Active",
      },
    ];
    await ApiKey.insertMany(defaults);
    console.log("[Seed] Default API keys created");
  } catch (e) {
    console.error("[Seed] API key seed error:", e.message);
  }
})();

// Seed default automated notification configs
(async () => {
  try {
    const defaults = [
      {
        operation: "tryon",
        enabled: true,
        titleTemplate: "Try-On Complete",
        bodyTemplate: "Your virtual try-on has been completed successfully.",
        channels: { app: true, email: true, push: true },
      },
      {
        operation: "recycle",
        enabled: true,
        titleTemplate: "Recycle Ready",
        bodyTemplate:
          "Your recycle analysis is ready with new upcycling ideas.",
        channels: { app: true, email: true, push: true },
      },
      {
        operation: "matching",
        enabled: true,
        titleTemplate: "Match Found",
        bodyTemplate: "We found new outfit matches for your wardrobe.",
        channels: { app: true, email: true, push: true },
      },
    ];
    for (const d of defaults) {
      await AutomatedNotification.updateOne(
        { operation: d.operation },
        { $set: d },
        { upsert: true },
      );
    }
    console.log("[Seed] Automated notification configs ready");
  } catch (e) {
    console.error("[Seed] Automated notification seed error:", e.message);
  }
})();

// User Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);

// Product routes
app.use("/api/stores", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stores/:store_id/products", productRoutes);

// Wardrobe routes
app.use(extractKeys);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/wardrobe", wardrobeRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/virtual-tryon", virtualTryOnRoutes);
app.use("/api/recycle", recycleRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/avatars", avatarRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/emails", emailRoutes);

const contactRoutes = require("./routes/contactRoutes");
app.use("/api/contact", contactRoutes);

const apiKeyRoutes = require("./routes/apiKeyRoutes");
app.use("/api/api-keys", apiKeyRoutes);

const automatedNotificationRoutes = require("./routes/automatedNotificationRoutes");
app.use("/api/automated-notifications", automatedNotificationRoutes);

module.exports = { app, seedAdminUser };
