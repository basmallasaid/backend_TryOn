const ContactMessage = require("../models/ContactMessage");
const sendEmail = require("../utils/sendEmail");

exports.submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required" });
    }
    const doc = await ContactMessage.create({ name, email, message });

    try {
      await sendEmail({
        email: process.env.ADMIN_EMAIL || "redolapy.admin@gmail.com",
        subject: `New Contact Message from ${name}`,
        message: `You have received a new contact message.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Contact Message</h2>
            <p>You have received a new contact message from your website.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Name</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td>
              </tr>
            </table>
            <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #555;">${message}</p>
            </div>
            <p style="color: #999; font-size: 12px;">This message was sent via the Contact Us form on your website.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send admin notification email:", emailErr.message);
    }

    res.status(201).json({ message: "Message sent successfully", id: doc._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const messages = await ContactMessage.find({}).sort({ created_at: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markContactRead = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    await ContactMessage.findByIdAndUpdate(id, { read: true });
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    await ContactMessage.findByIdAndDelete(id);
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
