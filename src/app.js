const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("./config/passport");

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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stores/:store_id/products", productRoutes);

module.exports = app;
