const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dbName = process.env.MONGO_DB_NAME || "tryon_db";
    await mongoose.connect(process.env.MONGO_URI, { dbName });

    console.log(`MongoDB Connected — database: "${dbName}"`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;
