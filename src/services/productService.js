const Product = require("../models/Product");
const Analysis = require("../models/Analysis");
const { analyzeClothing, imageUrlToDataUrl } = require("./analyze");

const createProduct = async (productData, options = {}) => {
  const product = new Product(productData);
  const savedProduct = await product.save();

  if (savedProduct.images && savedProduct.images.length > 0 && options.analyze !== false) {
    try {
      const dataUrl = await imageUrlToDataUrl(savedProduct.images[0]);
      const result = await analyzeClothing(dataUrl, {
        HF_TOKEN: options.HF_TOKEN,
      });

      if (result.garments && result.garments.length > 0) {
        const analysis = await Analysis.create({
          product_id: savedProduct._id,
          store_id: savedProduct.store_id,
          image: dataUrl,
          garments: result.garments,
          detectionType: result.detectionType,
        });

        savedProduct.analysis_id = analysis._id;
        await savedProduct.save();
      }
    } catch (err) {
      console.error(`[productService] Auto-analysis failed for ${savedProduct._id}:`, err.message);
    }
  }

  return savedProduct;
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
