"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const workspaceController_1 = require("../controllers/workspaceController");
const boards_1 = __importDefault(require("./boards"));
const router = (0, express_1.Router)();
router.use('/:workspaceId/boards', boards_1.default);
router.get('/', auth_1.authenticate, workspaceController_1.getWorkspaces);
router.post('/', auth_1.authenticate, workspaceController_1.createWorkspace);
router.get('/:workspaceId', auth_1.authenticate, workspaceController_1.getWorkspace);
router.post('/:workspaceId/members', auth_1.authenticate, (0, auth_1.requireWorkspaceRole)(['OWNER', 'ADMIN']), workspaceController_1.inviteMember);
router.delete('/:workspaceId/members/:memberId', auth_1.authenticate, (0, auth_1.requireWorkspaceRole)(['OWNER', 'ADMIN']), workspaceController_1.removeMember);
router.patch('/:workspaceId/members/:memberId/role', auth_1.authenticate, (0, auth_1.requireWorkspaceRole)(['OWNER']), workspaceController_1.updateMemberRole);
exports.default = router;
//# sourceMappingURL=workspaces.js.map