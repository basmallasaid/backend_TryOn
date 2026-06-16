const { Router } = require("express");
const { findMatchesForItem } = require("../services/recommendationEngine");
const WardrobeItem = require("../models/WardrobeItem");
const Product = require("../models/Product");
const Analysis = require("../models/Analysis");
const MatchHistory = require("../models/MatchHistory");
const protect = require("../middlewares/authMiddleware");
const { getWeather, scoreItemWeatherRelevance } = require("../services/weather");
const { analyzeClothing, imageUrlToDataUrl } = require("../services/analyze");
const { getItemColors } = require("../services/normalizer");
const { sendAutomated } = require("../services/notificationService");

const WARDROBE_SELECT = "name type category colors color style pattern season gender";
const PRODUCT_SELECT = "name category color_tags season_tags price currency purchase_url store_id analysis_id is_active";
const ANALYSIS_SELECT = "product_id garments";

function analysisToEngineItem(garment) {
  return {
    id: "__uploaded__",
    name: garment.specificType,
    type: garment.specificType,
    category: garment.category,
    colors: garment.colors,
    color: getItemColors(garment)[0]?.color || "unknown",
    style: garment.style,
    pattern: garment.pattern,
    season: garment.season,
    gender: garment.gender,
  };
}

const router = Router();

function toEngineItem(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name || doc.type,
    type: doc.type,
    category: doc.category,
    colors: doc.colors || [],
    color: doc.color || "unknown",
    style: doc.style || "casual",
    pattern: doc.pattern || "solid",
    season: doc.season || [],
    gender: doc.gender || "unisex",
  };
}

function productToEngineItem(product, analysis) {
  const colors = (product.color_tags || []).map((c) => ({ color: c, percentage: 100 }));
  const garment = analysis?.garments?.[0];
  return {
    id: `store_${product._id.toString()}`,
    name: product.name,
    type: product.name,
    category: product.category === "acc" ? "accessory" : product.category,
    colors: garment?.colors || colors,
    color: garment ? (garment.colors?.[0]?.color || "unknown") : (colors[0]?.color || "unknown"),
    style: garment?.style || "casual",
    pattern: garment?.pattern || "solid",
    season: garment?.season || product.season_tags || [],
    gender: garment?.gender || "unisex",
    _store: true,
    store_id: product.store_id,
    price: product.price,
    currency: product.currency,
    purchase_url: product.purchase_url,
  };
}

/**
 * @swagger
 * /api/matches:
 *   get:
 *     summary: Get match history for the user
 *     description: Returns past matching results, including weather data if available.
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of results to return (max 100)
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Match history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       source_garment:
 *                         type: object
 *                       matches:
 *                         type: array
 *                         items:
 *                           type: object
 *                       weather:
 *                         $ref: '#/components/schemas/WeatherData'
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Not authenticated
 */
router.get("/", protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = parseInt(req.query.skip) || 0;
    const history = await MatchHistory.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/matches:
 *   post:
 *     summary: Find matching items for a wardrobe item
 *     description: Returns matching items from both the user's wardrobe and store products. Optionally accepts lat/lon for weather-aware sorting.
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [wardrobe_item_id]
 *             properties:
 *               wardrobe_item_id:
 *                 type: string
 *                 description: ID of the wardrobe item to find matches for
 *                 example: "6658abc123def45678901234"
 *               lat:
 *                 type: number
 *                 format: float
 *                 description: Latitude for weather-aware matching (optional)
 *                 example: 30.0444
 *               lon:
 *                 type: number
 *                 format: float
 *                 description: Longitude for weather-aware matching (optional)
 *                 example: 31.2357
 *     responses:
 *       200:
 *         description: Matching items returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       item:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           category:
 *                             type: string
 *                           color:
 *                             type: string
 *                           style:
 *                             type: string
 *                           pattern:
 *                             type: string
 *                           season:
 *                             type: array
 *                             items:
 *                               type: string
 *                           source:
 *                             type: string
 *                             enum: [wardrobe, store]
 *                           weatherScore:
 *                             type: number
 *                             nullable: true
 *                           store_id:
 *                             type: string
 *                           price:
 *                             type: number
 *                           currency:
 *                             type: string
 *                           purchase_url:
 *                             type: string
 *                       score:
 *                         type: integer
 *                       reason:
 *                         type: object
 *                       raw:
 *                         type: object
 *                       explanation:
 *                         type: string
 *                 weather:
 *                   $ref: '#/components/schemas/WeatherData'
 *       400:
 *         description: wardrobe_item_id is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Wardrobe item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 */
router.post("/", protect, async (req, res) => {
  try {
    const { wardrobe_item_id, lat, lon } = req.body;
    if (!wardrobe_item_id) {
      return res.status(400).json({ error: "wardrobe_item_id is required" });
    }

    const t0 = Date.now();

    const sourceItem = await WardrobeItem.findOne({
      _id: wardrobe_item_id,
      user_id: req.user._id,
    })
      .lean()
      .select(WARDROBE_SELECT);
    if (!sourceItem) {
      return res.status(404).json({ error: "Wardrobe item not found" });
    }

    const t1 = Date.now();

    const weatherPromise = (lat !== undefined && lon !== undefined)
      ? getWeather(Number(lat), Number(lon)).catch(() => null)
      : Promise.resolve(null);

    const [allItems, rawProducts] = await Promise.all([
      WardrobeItem.find({ user_id: req.user._id, _id: { $ne: sourceItem._id } })
        .lean()
        .select(WARDROBE_SELECT),
      Product.find({ is_active: true })
        .lean()
        .select(PRODUCT_SELECT),
    ]);

    const t2 = Date.now();

    const weatherData = await weatherPromise;

    const t3 = Date.now();

    const productIdsWithAnalysis = rawProducts.filter((p) => p.analysis_id).map((p) => p.analysis_id);
    const productAnalyses = productIdsWithAnalysis.length
      ? await Analysis.find({ _id: { $in: productIdsWithAnalysis } })
          .lean()
          .select(ANALYSIS_SELECT)
      : [];
    const analysisMap = {};
    for (const a of productAnalyses) {
      if (a.product_id) analysisMap[a.product_id.toString()] = a;
    }

    const t4 = Date.now();

    const uploadedItem = toEngineItem(sourceItem);
    const wardrobeCandidates = allItems.map(toEngineItem);
    const productCandidates = rawProducts.map((p) =>
      productToEngineItem(p, analysisMap[p._id.toString()])
    );

    const allCandidates = [...wardrobeCandidates, ...productCandidates];

    const t5 = Date.now();

    const matches = findMatchesForItem(uploadedItem, allCandidates).map((m) => {
      const candidate = m.item;
      let weatherScore = null;
      if (weatherData) {
        weatherScore = scoreItemWeatherRelevance(candidate, weatherData);
      }
      const enrichedItem = {
        ...candidate,
        source: candidate._store ? "store" : "wardrobe",
        weatherScore,
        ...(candidate._store
          ? {
              store_id: candidate.store_id,
              price: candidate.price,
              currency: candidate.currency,
              purchase_url: candidate.purchase_url,
            }
          : {}),
      };
      delete enrichedItem._store;
      return { ...m, item: enrichedItem };
    });

    if (weatherData) {
      matches.sort((a, b) => {
        const aWs = a.weatherScore ?? 5;
        const bWs = b.weatherScore ?? 5;
        return bWs - aWs || b.score - a.score;
      });
    }

    const t6 = Date.now();

    await MatchHistory.create({
      user_id: req.user._id,
      source_garment: uploadedItem,
      matches,
      weather: weatherData,
    });

    sendAutomated('matching', req.user._id, { operation: 'matching' });

    const t7 = Date.now();

    console.log(`[PERF] POST /api/matches :: total=${t7 - t0}ms findOne=${t1 - t0}ms dbFetch=${t2 - t1}ms weather=${t3 - t2}ms analysis=${t4 - t3}ms transform=${t5 - t4}ms scoring=${t6 - t5}ms saveHistory=${t7 - t6}ms candidates=${allCandidates.length} matches=${matches.length}`);

    res.json({ matches, weather: weatherData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function wardrobeToEngineItem(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name || doc.type,
    type: doc.type,
    category: doc.category,
    colors: doc.colors || [],
    color: doc.color || "unknown",
    style: doc.style || "casual",
    pattern: doc.pattern || "solid",
    season: doc.season || [],
    gender: doc.gender || "unisex",
    image: doc.image || null,
  };
}

/**
 * @swagger
 * /api/matches/product/{productId}:
 *   post:
 *     summary: Find matching wardrobe items for a store product
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching wardrobe items
 *       404:
 *         description: Product not found
 */
router.post("/product/:productId", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    let analysis;
    let garment;

    if (product.analysis_id) {
      const savedAnalysis = await Analysis.findById(product.analysis_id)
        .lean()
        .select(ANALYSIS_SELECT);
      if (savedAnalysis && savedAnalysis.garments && savedAnalysis.garments.length) {
        analysis = savedAnalysis;
        garment = savedAnalysis.garments[0];
      }
    }

    if (!garment) {
      if (!product.images || !product.images.length) {
        return res.status(400).json({ error: "Product has no images to analyze" });
      }

      const dataUrl = await imageUrlToDataUrl(product.images[0]);
      const freshAnalysis = await analyzeClothing(dataUrl, {
        HF_TOKEN: req.apiKeys?.HF_TOKEN,
      });

      if (!freshAnalysis.garments || !freshAnalysis.garments.length) {
        return res.status(400).json({ error: "AI could not analyze this product image" });
      }

      analysis = await Analysis.create({
        product_id: product._id,
        store_id: product.store_id,
        image_hash: null,
        image: dataUrl,
        garments: freshAnalysis.garments,
        detectionType: freshAnalysis.detectionType,
      });

      product.analysis_id = analysis._id;
      await product.save();

      garment = freshAnalysis.garments[0];
    }

    const productItem = analysisToEngineItem(garment);
    productItem.id = `store_${product._id.toString()}`;
    productItem.price = product.price;
    productItem.currency = product.currency;
    productItem.purchase_url = product.purchase_url;
    productItem._store = true;

    const analyzedProduct = {
      _id: product._id,
      name: product.name,
      description: product.description,
      images: product.images,
      price: product.price,
      currency: product.currency,
      purchase_url: product.purchase_url,
      store_id: product.store_id,
      ai_analysis: {
        category: garment.category,
        specificType: garment.specificType,
        confidence: garment.confidence,
        colors: garment.colors,
        style: garment.style,
        pattern: garment.pattern,
        season: garment.season,
        gender: garment.gender,
      },
    };

    const wardrobeItems = await WardrobeItem.find({ user_id: req.user._id })
      .lean()
      .select(WARDROBE_SELECT);
    if (!wardrobeItems.length) {
      return res.json({ matches: [], analyzedProduct });
    }

    const wardrobeCandidates = wardrobeItems.map(wardrobeToEngineItem);

    const matches = findMatchesForItem(productItem, wardrobeCandidates).map((m) => ({
      ...m,
      item: { ...m.item, source: "wardrobe" },
    }));

    res.json({ matches, analyzedProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/matches/analysis/{analysisId}:
 *   post:
 *     summary: Find matching items for an analyzed image
 *     description: Returns matches from both the user's wardrobe and store products
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lat:
 *                 type: number
 *               lon:
 *                 type: number
 *     responses:
 *       200:
 *         description: Matching items
 *       404:
 *         description: Analysis not found
 */
router.post("/analysis/:analysisId", protect, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.analysisId,
      user_id: req.user._id,
    })
      .lean()
      .select(ANALYSIS_SELECT);
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    if (!analysis.garments || !analysis.garments.length) {
      return res.status(400).json({ error: "No garments found in analysis" });
    }

    const { lat, lon } = req.body;

    const weatherPromise = (lat !== undefined && lon !== undefined)
      ? getWeather(Number(lat), Number(lon)).catch(() => null)
      : Promise.resolve(null);

    const [wardrobeItems, rawProducts] = await Promise.all([
      WardrobeItem.find({ user_id: req.user._id })
        .lean()
        .select(WARDROBE_SELECT),
      Product.find({ is_active: true })
        .lean()
        .select(PRODUCT_SELECT),
    ]);

    const weatherData = await weatherPromise;

    const productIdsWithAnalysis = rawProducts.filter((p) => p.analysis_id).map((p) => p.analysis_id);
    const productAnalyses = productIdsWithAnalysis.length
      ? await Analysis.find({ _id: { $in: productIdsWithAnalysis } })
          .lean()
          .select(ANALYSIS_SELECT)
      : [];
    const analysisMap = {};
    for (const a of productAnalyses) {
      if (a.product_id) analysisMap[a.product_id.toString()] = a;
    }

    const uploadedItem = analysisToEngineItem(analysis.garments[0]);
    const wardrobeCandidates = wardrobeItems.map(wardrobeToEngineItem);
    const productCandidates = rawProducts.map((p) =>
      productToEngineItem(p, analysisMap[p._id.toString()])
    );

    const allCandidates = [...wardrobeCandidates, ...productCandidates];

    const matches = findMatchesForItem(uploadedItem, allCandidates).map((m) => {
      const candidate = m.item;
      let weatherScore = null;
      if (weatherData) {
        weatherScore = scoreItemWeatherRelevance(candidate, weatherData);
      }
      const enrichedItem = {
        ...candidate,
        source: candidate._store ? "store" : "wardrobe",
        weatherScore,
        ...(candidate._store
          ? {
              store_id: candidate.store_id,
              price: candidate.price,
              currency: candidate.currency,
              purchase_url: candidate.purchase_url,
            }
          : {}),
      };
      delete enrichedItem._store;
      return { ...m, item: enrichedItem };
    });

    if (weatherData) {
      matches.sort((a, b) => {
        const aWs = a.weatherScore ?? 5;
        const bWs = b.weatherScore ?? 5;
        return bWs - aWs || b.score - a.score;
      });
    }

    await MatchHistory.create({
      user_id: req.user._id,
      source_garment: uploadedItem,
      matches,
      weather: weatherData,
    });

    sendAutomated('matching', req.user._id, { operation: 'matching' });

    res.json({ matches, weather: weatherData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
