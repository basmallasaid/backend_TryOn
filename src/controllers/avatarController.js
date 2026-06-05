const Avatar = require("../models/Avatar");
const { generateAvatarImage } = require("../services/imageGenerationService");

const createAvatar = async (req, res) => {
  try {
    const { age, gender, skin_tone, face_shape, hair_style, eye_color, beard_style, facial_expression } = req.body;

    if (!age || !gender || !skin_tone || !face_shape || !hair_style || !eye_color || !beard_style || !facial_expression) {
      return res.status(400).json({ message: "All avatar attributes are required" });
    }

    const avatar = await Avatar.create({
      user_id: req.user._id,
      age,
      gender,
      skin_tone,
      face_shape,
      hair_style,
      eye_color,
      beard_style,
      facial_expression,
    });

    const prompt = `A photorealistic full-body image of a ${age} ${gender} with ${skin_tone} skin, a ${face_shape} face, ${hair_style}, ${eye_color}, ${beard_style} beard, and a ${facial_expression} expression. Front-facing, well-lit, neutral background, high-quality digital avatar. The entire body from head to toe must be visible.`;

    try {
      const apiKey = req.apiKeys?.KIE_API_KEY;
      if (!apiKey) {
        throw new Error("KIE API key is required. Provide it via x-kie-api-key header.");
      }
      const imageUrl = await generateAvatarImage(prompt, apiKey);
      avatar.image_url = imageUrl;
      avatar.status = "completed";
      await avatar.save();
    } catch (apiError) {
      avatar.status = "failed";
      await avatar.save();
      return res.status(500).json({ message: "Image generation failed", error: apiError.message, avatar });
    }

    res.status(201).json({ message: "Avatar created successfully", avatar });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserAvatars = async (req, res) => {
  try {
    const avatars = await Avatar.find({ user_id: req.user._id }).sort({ created_at: -1 });
    res.json({ avatars });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAvatar, getUserAvatars };
