"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInviteEmail = exports.sendTaskAssignmentEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const isEmailConfigured = () => !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const sendTaskAssignmentEmail = async (to, name, taskTitle) => {
    if (!isEmailConfigured())
        return;
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Task Manager <noreply@taskmanager.app>',
        to,
        subject: `New Task Assigned: ${taskTitle}`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366F1;">Task Assigned</h2>
        <p>Hi ${name},</p>
        <p>You have been assigned a new task: <strong>${taskTitle}</strong></p>
        <p>Log in to your Task Manager dashboard to view and manage this task.</p>
        <a href="${process.env.CLIENT_URL}" style="
          display: inline-block;
          background: #6366F1;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin-top: 16px;
        ">Open Task Manager</a>
      </div>
    `,
    });
};
exports.sendTaskAssignmentEmail = sendTaskAssignmentEmail;
const sendInviteEmail = async (to, name, workspaceName) => {
    if (!isEmailConfigured())
        return;
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Task Manager <noreply@taskmanager.app>',
        to,
        subject: `You've been invited to ${workspaceName}`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366F1;">Workspace Invitation</h2>
        <p>Hi ${name},</p>
        <p>You have been invited to join the workspace: <strong>${workspaceName}</strong></p>
        <a href="${process.env.CLIENT_URL}" style="
          display: inline-block;
          background: #6366F1;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin-top: 16px;
        ">Open Task Manager</a>
      </div>
    `,
    });
};
exports.sendInviteEmail = sendInviteEmail;
//# sourceMappingURL=emailService.js.map