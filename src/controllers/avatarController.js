const Avatar = require("../models/Avatar");
const User = require("../models/User");
const { generateAvatarImage } = require("../services/imageGenerationService");
const { sendAutomated } = require("../services/notificationService");

const createAvatar = async (req, res) => {
  try {
    const { age, gender, skin_tone, face_shape, hair_color, eye_color, beard_style, facial_expression, height, weight } = req.body;

    if (!age || !gender || !skin_tone || !face_shape || !hair_color || !eye_color || !beard_style || !facial_expression || !height || !weight) {
      return res.status(400).json({ message: "All avatar attributes are required" });
    }

    const avatar = await Avatar.create({
      user_id: req.user._id,
      age,
      gender,
      skin_tone,
      face_shape,
      hair_color,
      eye_color,
      beard_style,
      facial_expression,
      height,
      weight,
    });

    const prompt = `A photorealistic full-body image of an Egyptian ${age} ${gender} with ${skin_tone} skin, a ${face_shape} face, ${hair_color} hair, ${eye_color}, ${beard_style} beard, ${height} tall, ${weight}, and a ${facial_expression} expression. The person is wearing a white shirt and jeans. Front-facing, well-lit, white background, high-quality digital avatar. The entire body from head to toe must be visible.`;

    try {
      const apiKey = process.env.KIE_API_key;
      if (!apiKey) {
        throw new Error("KIE API key is required. Set KIE_API_key in .env");
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

    await User.findByIdAndUpdate(req.user._id, { $push: { avatars: avatar._id } });

    sendAutomated('avatar', req.user._id, { operation: 'avatar' });

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

const getAvatarById = async (req, res) => {
  try {
    const avatar = await Avatar.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!avatar) return res.status(404).json({ message: "Avatar not found" });
    res.json({ avatar });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const allowedFields = ["age", "gender", "skin_tone", "face_shape", "hair_color", "eye_color", "beard_style", "facial_expression", "height", "weight"];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const avatar = await Avatar.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!avatar) return res.status(404).json({ message: "Avatar not found" });

    res.json({ message: "Avatar updated successfully", avatar });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAvatar = async (req, res) => {
  try {
    const avatar = await Avatar.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    if (!avatar) return res.status(404).json({ message: "Avatar not found" });
    res.json({ message: "Avatar deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAvatar, getUserAvatars, getAvatarById, updateAvatar, deleteAvatar };
