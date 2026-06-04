require("dotenv").config();
const mongoose = require("mongoose");
const storeService = require("../src/services/storeService");

const runTest = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.\n");

    console.log("Testing CREATE STORE...");
    const sampleStore = {
      name: "Test Store",
      logo_url: "https://example.com/logo.png",
      description: "A wonderful test store for TryOn application.",
      website_url: "https://example.com",
      discount_code: "SAVE10",
      discount_percent: 10,
    };
    const created = await storeService.createStore(sampleStore);
    console.log("Store Created:", created);
    console.log("---------------------------------------------\n");

    console.log("Testing GET ALL STORES...");
    const allStores = await storeService.getAllStores();
    console.log(`Total stores found: ${allStores.length}`);
    console.log("---------------------------------------------\n");

    console.log("Testing GET STORE BY ID...");
    const fetched = await storeService.getStoreById(created._id);
    console.log("Fetched Store:", fetched);
    console.log("---------------------------------------------\n");

    console.log("Testing UPDATE STORE...");
    const updated = await storeService.updateStore(created._id, {
      discount_code: "SAVE20",
      discount_percent: 20,
    });
    console.log("Updated Store:", updated);
    console.log("---------------------------------------------\n");

    console.log("Testing DELETE STORE...");
    const deleted = await storeService.deleteStore(created._id);
    console.log("Deleted Store:", deleted);
    console.log("---------------------------------------------\n");

    const verifyDeleted = await storeService.getStoreById(created._id);
    if (!verifyDeleted) {
      console.log("Verification Success: Store was successfully deleted from database.");
    } else {
      console.log("Verification Failed: Store still exists!");
    }

  } catch (error) {
    console.error("Test encountered an error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
};

runTest();
