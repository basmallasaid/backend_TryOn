const Store = require("../models/Store");

const createStore = async (storeData) => {
  const store = new Store(storeData);
  return await store.save();
};

const getStoreById = async (id) => {
  return await Store.findById(id);
};

const getAllStores = async (filter = {}) => {
  return await Store.find(filter);
};

const updateStore = async (id, storeData) => {
  return await Store.findByIdAndUpdate(id, storeData, {
    new: true,
    runValidators: true,
  });
};

const deleteStore = async (id) => {
  return await Store.findByIdAndDelete(id);
};

module.exports = {
  createStore,
  getStoreById,
  getAllStores,
  updateStore,
  deleteStore,
};
