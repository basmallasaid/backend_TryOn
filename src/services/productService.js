const Product = require("../models/Product");

const createProduct = async (productData) => {
  const product = new Product(productData);
  return await product.save();
};

const getProductById = async (id) => {
  return await Product.findById(id).populate("store_id", "name logo_url website_url");
};

const getAllProducts = async (filter = {}) => {
  return await Product.find(filter).populate("store_id", "name logo_url website_url");
};

const getProductsByStore = async (store_id, filter = {}) => {
  return await Product.find({ store_id, ...filter }).populate(
    "store_id",
    "name logo_url website_url"
  );
};

const updateProduct = async (id, productData) => {
  return await Product.findByIdAndUpdate(id, productData, {
    new: true,
    runValidators: true,
  });
};

const deleteProduct = async (id) => {
  return await Product.findByIdAndDelete(id);
};

module.exports = {
  createProduct,
  getProductById,
  getAllProducts,
  getProductsByStore,
  updateProduct,
  deleteProduct,
};
