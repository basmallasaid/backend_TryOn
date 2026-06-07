const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
require("./config/passport");

const {
  extractKeys,
} = require("./middlewares/extractKeys");
const analyzeRoutes = require("./routes/analyzeRoutes");
const wardrobeRoutes = require("./routes/wardrobeRoutes");
const matchesRoutes = require("./routes/matchesRoutes");
const recommendationsRoutes = require("./routes/recommendationsRoutes");
const virtualTryOnRoutes = require("./routes/virtualTryOnRoutes");
const recycleRoutes = require("./routes/recycleRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const avatarRoutes = require("./routes/avatarRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const storeRoutes = require("./routes/storeRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "TryOn API Docs",
}));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// User Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

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

module.exports = app;
