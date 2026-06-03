const productService = require("../services/productService");

const VALID_CATEGORIES = ["top", "bottom", "dress", "acc"];

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const {
      store_id,
      name,
      description,
      images,
      category,
      color_tags,
      season_tags,
      price,
      currency,
      purchase_url,
      try_on_enabled,
      is_active,
    } = req.body;

    // Validate required fields
    if (!store_id || !name || !description || !category || price === undefined || !purchase_url) {
      return res.status(400).json({
        message:
          "store_id, name, description, category, price, and purchase_url are required.",
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `category must be one of: ${VALID_CATEGORIES.join(", ")}.`,
      });
    }

    const productData = {
      store_id,
      name,
      description,
      images: images || [],
      category,
      color_tags: color_tags || [],
      season_tags: season_tags || [],
      price,
      currency: currency || "USD",
      purchase_url,
      try_on_enabled: try_on_enabled !== undefined ? try_on_enabled : false,
      is_active: is_active !== undefined ? is_active : true,
    };

    const newProduct = await productService.createProduct(productData);

    return res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const filter = {};

    if (req.query.store_id) filter.store_id = req.query.store_id;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.is_active !== undefined)
      filter.is_active = req.query.is_active === "true";
    if (req.query.try_on_enabled !== undefined)
      filter.try_on_enabled = req.query.try_on_enabled === "true";

    const products = await productService.getAllProducts(filter);
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/stores/:store_id/products
const getProductsByStore = async (req, res) => {
  try {
    const { store_id } = req.params;
    const filter = {};

    if (req.query.category) filter.category = req.query.category;
    if (req.query.is_active !== undefined)
      filter.is_active = req.query.is_active === "true";

    const products = await productService.getProductsByStore(store_id, filter);
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.category && !VALID_CATEGORIES.includes(updateData.category)) {
      return res.status(400).json({
        message: `category must be one of: ${VALID_CATEGORIES.join(", ")}.`,
      });
    }

    const updatedProduct = await productService.updateProduct(id, updateData);
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await productService.deleteProduct(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductsByStore,
  updateProduct,
  deleteProduct,
};
