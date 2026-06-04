const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("./config/passport");

const {
  extractKeys,
} = require("./middlewares/extractKeys");
const analyzeRoutes = require("./routes/analyzeRoutes");
const wardrobeRoutes = require("./routes/wardrobeRoutes");
const matchesRoutes = require("./routes/matchesRoutes");
const recommendationsRoutes = require("./routes/recommendationsRoutes");
const virtualTryOnRoutes = require("./routes/virtualTryOnRoutes");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const storeRoutes = require("./routes/storeRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

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

module.exports = app;
