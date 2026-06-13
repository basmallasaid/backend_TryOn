const Email = require("../models/Email");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const buildEmailHtml = (content) => {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">ReDolapy</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Virtual Try-On Experience</p>
        </div>
        <div style="padding: 30px;">
          <div style="white-space: pre-wrap; line-height: 1.7; color: #333333; font-size: 15px;">${content}</div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0 0 4px; color: #666666; font-size: 14px;">Best regards,</p>
            <p style="margin: 0; color: #667eea; font-size: 15px; font-weight: 600;">The ReDolapy Team</p>
            <p style="margin: 8px 0 0; color: #999999; font-size: 12px;">Virtual Try-On &amp; Fashion Analysis Platform</p>
          </div>
        </div>
      </div>
      <p style="text-align: center; color: #aaaaaa; font-size: 11px; margin-top: 20px;">&copy; ${new Date().getFullYear()} ReDolapy. All rights reserved.</p>
    </div>
  `;
};

const storeEmail = async (data) => {
  return await Email.create(data);
};

const sendAndStore = async ({ senderUserId, receiverUserId, senderEmail, receiverEmail, subject, message, emailType, parentEmailId }) => {
  const emailRecord = await storeEmail({
    senderUserId,
    receiverUserId,
    senderEmail,
    receiverEmail,
    subject,
    message,
    emailType,
    parentEmailId: parentEmailId || null,
  });

  try {
    await sendEmail({
      email: receiverEmail,
      subject,
      message,
      html: buildEmailHtml(message),
    });
    return emailRecord;
  } catch (error) {
    emailRecord.status = "failed";
    await emailRecord.save();
    throw error;
  }
};

const sendToAllUsers = async ({ senderUserId, senderEmail, subject, message, emailType }) => {
  const users = await User.find({}).select("email _id");
  const sentEmails = [];
  const failedEmails = [];

  for (const user of users) {
    try {
      const emailRecord = await sendAndStore({
        senderUserId,
        receiverUserId: user._id,
        senderEmail,
        receiverEmail: user.email,
        subject,
        message,
        emailType,
      });
      sentEmails.push(emailRecord);
    } catch (error) {
      failedEmails.push({ email: user.email, error: error.message });
    }
  }

  return { sent: sentEmails.length, failed: failedEmails };
};

const getEmails = async (filter = {}, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const emails = await Email.find(filter)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate("senderUserId", "email profile.first_name profile.last_name")
    .populate("receiverUserId", "email profile.first_name profile.last_name")
    .populate("parentEmailId");
  const total = await Email.countDocuments(filter);
  return { emails, total, page, limit };
};

const getThread = async (parentEmailId) => {
  const root = await Email.findById(parentEmailId);
  if (!root) return null;

  const replies = await Email.find({ parentEmailId })
    .sort({ created_at: 1 })
    .populate("senderUserId", "email profile.first_name profile.last_name")
    .populate("receiverUserId", "email profile.first_name profile.last_name");

  return { root, replies };
};

const replyToEmail = async ({ parentEmailId, senderUserId, receiverUserId, senderEmail, receiverEmail, subject, message }) => {
  return await sendAndStore({
    senderUserId,
    receiverUserId,
    senderEmail,
    receiverEmail,
    subject: `Re: ${subject}`,
    message,
    emailType: "ADMIN_TO_USER",
    parentEmailId,
  });
};

const markAsRead = async (emailId) => {
  return await Email.findByIdAndUpdate(
    emailId,
    { isRead: true, readAt: new Date() },
    { new: true },
  );
};

const markAsUnread = async (emailId) => {
  return await Email.findByIdAndUpdate(
    emailId,
    { isRead: false, readAt: null },
    { new: true },
  );
};

const getUnreadCount = async (filter = {}) => {
  return await Email.countDocuments({ ...filter, isRead: false });
};

module.exports = {
  sendAndStore,
  sendToAllUsers,
  getEmails,
  getThread,
  replyToEmail,
  markAsRead,
  markAsUnread,
  getUnreadCount,
  storeEmail,
};
