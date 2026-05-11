"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const taskController_1 = require("../controllers/taskController");
const createTaskRouter = (io) => {
    const router = (0, express_1.Router)({ mergeParams: true });
    router.post('/columns/:columnId/tasks', auth_1.authenticate, (0, taskController_1.createTask)(io));
    router.get('/tasks/:taskId', auth_1.authenticate, taskController_1.getTask);
    router.patch('/tasks/:taskId', auth_1.authenticate, (0, taskController_1.updateTask)(io));
    router.patch('/tasks/:taskId/move', auth_1.authenticate, (0, taskController_1.moveTask)(io));
    router.delete('/tasks/:taskId', auth_1.authenticate, (0, taskController_1.deleteTask)(io));
    router.post('/tasks/:taskId/attachments', auth_1.authenticate, upload_1.upload.single('file'), (0, taskController_1.uploadAttachment)(io));
    router.get('/notifications', auth_1.authenticate, taskController_1.getNotifications);
    router.patch('/notifications/read', auth_1.authenticate, taskController_1.markNotificationsRead);
    return router;
};
exports.default = createTaskRouter;
//# sourceMappingURL=tasks.js.map