"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBoardRouterIo = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const boardController_1 = require("../controllers/boardController");
let _io;
const setBoardRouterIo = (io) => {
    _io = io;
};
exports.setBoardRouterIo = setBoardRouterIo;
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/', auth_1.authenticate, boardController_1.getBoards);
router.post('/', auth_1.authenticate, boardController_1.createBoard);
router.get('/:boardId', auth_1.authenticate, boardController_1.getBoard);
router.patch('/:boardId', auth_1.authenticate, boardController_1.updateBoard);
router.delete('/:boardId', auth_1.authenticate, boardController_1.deleteBoard);
router.post('/:boardId/columns', auth_1.authenticate, boardController_1.createColumn);
router.patch('/:boardId/columns/:columnId', auth_1.authenticate, boardController_1.updateColumn);
router.delete('/:boardId/columns/:columnId', auth_1.authenticate, boardController_1.deleteColumn);
exports.default = router;
//# sourceMappingURL=boards.js.map