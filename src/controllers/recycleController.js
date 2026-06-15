const RecycleSession = require("../models/RecycleSession");
const {
  analyzeImages,
  generateRecycleImage,
  ensureProductShotSuffix,
  bufferToDataUrl,
  translateUpcycleResult,
} = require("../services/recycleService");
const { sendAutomated } = require("../services/notificationService");

exports.analyze = async (req, res) => {
  try {
    const files = req.files || [];

    if (!files.length || files.length > 3) {
      return res.status(400).json({ error: "Send 1 to 3 images" });
    }

    const imageDataUrls = files.map((f) => bufferToDataUrl(f.buffer, f.mimetype));

    const githubToken = req.apiKeys?.GITHUB_TOKEN || process.env.API_KEY;
    if (!githubToken) {
      return res.status(400).json({ error: "GitHub token is required. Provide it via x-github-token header." });
    }

    const result = await analyzeImages(imageDataUrls, files.length, githubToken);

    // Translate all text fields to Arabic
    let translatedResult;
    try {
      translatedResult = await translateUpcycleResult(result);
      console.log("[Recycle] Translation to Arabic completed");
    } catch (trErr) {
      console.error("[Recycle] Translation failed, storing English only:", trErr.message);
      translatedResult = {
        ...result,
        garment_analysis_ar: null,
        upcycling_ideas: result.upcycling_ideas.map((idea) => ({
          ...idea,
          title_ar: null,
          design_description_ar: null,
        })),
      };
    }

    const session = await RecycleSession.create({
      user_id: req.user?._id || null,
      input_images: files.map((f) => ({
        url: bufferToDataUrl(f.buffer, f.mimetype),
        original_name: f.originalname,
        mime_type: f.mimetype,
        size_bytes: f.size,
      })),
      image_count: files.length,
      mode: translatedResult.mode,
      garment_analysis: translatedResult.garment_analysis,
      garment_analysis_ar: translatedResult.garment_analysis_ar,
      ideas: translatedResult.upcycling_ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        title_ar: idea.title_ar,
        design_description: idea.design_description,
        design_description_ar: idea.design_description_ar,
        image_prompt: idea.image_prompt,
        generated_image_url: null,
        generation_status: "pending",
        generation_error: null,
        generated_at: null,
      })),
      status: "analyzed",
      model_used: "gpt-4o-mini",
    });

    res.json({
      success: true,
      session_id: session._id,
      mode: translatedResult.mode,
      garment_analysis: translatedResult.garment_analysis,
      garment_analysis_ar: translatedResult.garment_analysis_ar,
      ideas: session.ideas.map(({ id, title, title_ar, design_description, design_description_ar }) => ({
        id,
        title,
        title_ar,
        design_description,
        design_description_ar,
      })),
    });
  } catch (error) {
    console.error("Recycle Analyze Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.generateIdea = async (req, res) => {
  try {
    const { id, ideaId } = req.params;
    const { model } = req.body;
    const session = await RecycleSession.findById(id);

    if (!session) return res.status(404).json({ error: "Session not found" });

    const idea = session.ideas.find((i) => i.id === Number(ideaId));
    if (!idea) return res.status(404).json({ error: "Idea not found" });

    if (idea.generation_status === "done") {
      return res.json({
        success: true,
        already_generated: true,
        image_url: idea.generated_image_url,
      });
    }

    idea.generation_status = "generating";
    await session.save();

    const apiKey = req.apiKeys?.DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      idea.generation_status = "failed";
      idea.generation_error = "DashScope API key is required. Provide it via x-dashscope-api-key header.";
      await session.save();
      return res.status(400).json({ error: idea.generation_error });
    }

    const sourceImages = session.input_images.map((img) => img.url);
    const finalPrompt = ensureProductShotSuffix(idea.image_prompt);

    let imageUrl;
    try {
      imageUrl = await generateRecycleImage(
        model || "qwen-image-2.0-pro",
        finalPrompt,
        sourceImages,
        "1024*1024",
        apiKey,
      );
    } catch (genErr) {
      idea.generation_status = "failed";
      idea.generation_error = genErr.message;
      await session.save();
      return res.status(500).json({ error: "Image generation failed", message: genErr.message });
    }

    idea.generated_image_url = imageUrl;
    idea.generation_status = "done";
    idea.generated_at = new Date();
    idea.generation_error = null;

    const allDone = session.ideas.every((i) => i.generation_status === "done");
    const anyDone = session.ideas.some((i) => i.generation_status === "done");
    session.status = allDone ? "completed" : anyDone ? "partial" : "analyzed";
    await session.save();

    if (req.user?._id) {
      sendAutomated('recycle', req.user._id, { operation: 'recycle' });
    }

    res.json({
      success: true,
      idea_id: idea.id,
      image_url: idea.generated_image_url,
    });
  } catch (error) {
    console.error("Recycle Generate Idea Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.generateAllIdeas = async (req, res) => {
  try {
    const { id } = req.params;
    const { model } = req.body;
    const session = await RecycleSession.findById(id);

    if (!session) return res.status(404).json({ error: "Session not found" });

    const apiKey = req.apiKeys?.DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "DashScope API key is required. Provide it via x-dashscope-api-key header." });
    }

    const sourceImages = session.input_images.map((img) => img.url);
    const results = [];

    for (const idea of session.ideas) {
      if (idea.generation_status === "done") {
        results.push({
          id: idea.id,
          title: idea.title,
          image: idea.generated_image_url,
          success: true,
          already_generated: true,
        });
        continue;
      }

      const finalPrompt = ensureProductShotSuffix(idea.image_prompt);
      idea.generation_status = "generating";
      await session.save();

      try {
        const imageUrl = await generateRecycleImage(
          model || "qwen-image-2.0-pro",
          finalPrompt,
          sourceImages,
          "1024*1024",
          apiKey,
        );

        idea.generated_image_url = imageUrl;
        idea.generation_status = "done";
        idea.generated_at = new Date();
        idea.generation_error = null;

        results.push({
          id: idea.id,
          title: idea.title,
          image: imageUrl,
          success: true,
        });
      } catch (genErr) {
        idea.generation_status = "failed";
        idea.generation_error = genErr.message;

        results.push({
          id: idea.id,
          title: idea.title,
          image: null,
          success: false,
          error: genErr.message,
        });
      }

      await session.save();
    }

    const allDone = session.ideas.every((i) => i.generation_status === "done");
    const anyDone = session.ideas.some((i) => i.generation_status === "done");
    session.status = allDone ? "completed" : anyDone ? "partial" : "analyzed";
    await session.save();

    if (req.user?._id) {
      sendAutomated('recycle', req.user._id, { operation: 'recycle' });
    }

    const successCount = results.filter((r) => r.success).length;
    res.json({
      success: successCount > 0,
      results,
      total_generated: successCount,
    });
  } catch (error) {
    console.error("Recycle Generate All Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await RecycleSession.findById(req.params.id);

    if (!session) return res.status(404).json({ error: "Session not found" });

    res.json({
      success: true,
      session_id: session._id,
      status: session.status,
      mode: session.mode,
      image_count: session.image_count,
      garment_analysis: session.garment_analysis,
      garment_analysis_ar: session.garment_analysis_ar,
      ideas: session.ideas.map((i) => ({
        id: i.id,
        title: i.title,
        title_ar: i.title_ar,
        design_description: i.design_description,
        design_description_ar: i.design_description_ar,
        generation_status: i.generation_status,
        generated_image_url: i.generated_image_url,
        generated_at: i.generated_at,
      })),
    });
  } catch (error) {
    console.error("Recycle Get Session Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
