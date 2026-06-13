const emailService = require("../services/emailService");
const User = require("../models/User");

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

exports.adminSendToUser = async (req, res) => {
  try {
    const { receiverEmail, subject, message } = req.body;

    if (!receiverEmail || !subject || !message) {
      return res.status(400).json({ message: "receiverEmail, subject, and message are required" });
    }

    const receiver = await User.findOne({ email: receiverEmail });
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const emailRecord = await emailService.sendAndStore({
      senderUserId: req.user._id,
      receiverUserId: receiver._id,
      senderEmail: req.user.email,
      receiverEmail,
      subject,
      message,
      emailType: "ADMIN_TO_USER",
    });

    res.status(201).json({ message: "Email sent successfully", email: emailRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminSendToAll = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "subject and message are required" });
    }

    const result = await emailService.sendToAllUsers({
      senderUserId: req.user._id,
      senderEmail: req.user.email,
      subject,
      message,
      emailType: "ADMIN_TO_ALL",
    });

    res.status(201).json({
      message: "Emails sent",
      sentCount: result.sent,
      failedCount: result.failed.length,
      failures: result.failed.length > 0 ? result.failed : undefined,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminGetAllEmails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await emailService.getEmails({}, page, limit);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminGetThread = async (req, res) => {
  try {
    const { parentEmailId } = req.params;
    const thread = await emailService.getThread(parentEmailId);
    if (!thread) {
      return res.status(404).json({ message: "Email not found" });
    }
    res.status(200).json(thread);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminReplyToUser = async (req, res) => {
  try {
    const { parentEmailId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }

    const parentEmail = await emailService.getThread(parentEmailId);
    if (!parentEmail) {
      return res.status(404).json({ message: "Parent email not found" });
    }

    const root = parentEmail.root;
    const receiverEmail = root.senderEmail;
    const receiver = await User.findOne({ email: receiverEmail });

    const emailRecord = await emailService.replyToEmail({
      parentEmailId,
      senderUserId: req.user._id,
      receiverUserId: receiver ? receiver._id : null,
      senderEmail: req.user.email,
      receiverEmail,
      subject: root.subject,
      message,
    });

    res.status(201).json({ message: "Reply sent successfully", email: emailRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminMarkRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;

    const email = isRead === false
      ? await emailService.markAsUnread(id)
      : await emailService.markAsRead(id);

    if (!email) {
      return res.status(404).json({ message: "Email not found" });
    }

    res.status(200).json({ message: isRead === false ? "Marked as unread" : "Marked as read", email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminGetUnreadCount = async (req, res) => {
  try {
    const count = await emailService.getUnreadCount();
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminMarkAllRead = async (req, res) => {
  try {
    const result = await emailService.markAllAsRead();
    res.status(200).json({ message: "All emails marked as read", modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adminFilterEmails = async (req, res) => {
  try {
    const { sender, receiver, dateFrom, dateTo, isRead, page, limit } = req.query;
    const filter = {};

    if (sender) {
      filter.$or = [
        { senderEmail: { $regex: sender, $options: "i" } },
        { senderUserId: sender },
      ];
    }

    if (receiver) {
      filter.receiverEmail = { $regex: receiver, $options: "i" };
    }

    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) filter.created_at.$gte = new Date(dateFrom);
      if (dateTo) filter.created_at.$lte = new Date(dateTo);
    }

    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }

    const result = await emailService.getEmails(filter, parseInt(page) || 1, parseInt(limit) || 50);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── User Endpoints ──────────────────────────────────────────────────────────

exports.userContactAdmin = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "subject and message are required" });
    }

    const adminEmail = process.env.EMAIL_USER;

    const emailRecord = await emailService.sendAndStore({
      senderUserId: req.user._id,
      receiverUserId: null,
      senderEmail: req.user.email,
      receiverEmail: adminEmail,
      subject,
      message,
      emailType: "USER_TO_ADMIN",
    });

    res.status(201).json({ message: "Message sent to admin successfully", email: emailRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.userGetSentMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await emailService.getEmails(
      { senderUserId: req.user._id, emailType: "USER_TO_ADMIN" },
      page,
      limit,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.userGetAdminReplies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await emailService.getEmails(
      { receiverEmail: req.user.email, emailType: "ADMIN_TO_USER" },
      page,
      limit,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.userGetConversation = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await emailService.getEmails(
      {
        $or: [
          { senderUserId: req.user._id, emailType: "USER_TO_ADMIN" },
          { receiverEmail: req.user.email, emailType: "ADMIN_TO_USER" },
        ],
      },
      page,
      limit,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
