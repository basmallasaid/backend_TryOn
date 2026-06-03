const storeService = require("../services/storeService");

const createStore = async (req, res) => {
  try {
    const {
      name,
      logo_url,
      description,
      website_url,
      discount_code,
      discount_percent,
      is_active,
    } = req.body;

    // Validate required fields
    if (!name || !logo_url || !description || !website_url) {
      return res.status(400).json({
        message: "name, logo_url, description, and website_url are required.",
      });
    }

    const storeData = {
      name,
      logo_url,
      description,
      website_url,
      discount_code: discount_code !== undefined ? discount_code : null,
      discount_percent: discount_percent !== undefined ? discount_percent : null,
      is_active: is_active !== undefined ? is_active : true,
    };

    const newStore = await storeService.createStore(storeData);

    return res.status(201).json({
      message: "Store created successfully",
      store: newStore,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getStores = async (req, res) => {
  try {
    const filter = {};
    if (req.query.is_active !== undefined) {
      filter.is_active = req.query.is_active === "true";
    }
    const stores = await storeService.getAllStores(filter);
    return res.status(200).json(stores);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await storeService.getStoreById(id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    return res.status(200).json(store);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedStore = await storeService.updateStore(id, updateData);
    if (!updatedStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    return res.status(200).json({
      message: "Store updated successfully",
      store: updatedStore,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStore = await storeService.deleteStore(id);
    if (!deletedStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    return res.status(200).json({
      message: "Store deleted successfully",
      store: deletedStore,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
};
