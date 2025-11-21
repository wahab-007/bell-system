"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockRouter = void 0;
const express_1 = require("express");
const blockController_1 = require("../controllers/blockController");
const auth_1 = require("../middleware/auth");
exports.blockRouter = (0, express_1.Router)();
exports.blockRouter.use((0, auth_1.requireAuth)());
exports.blockRouter.get('/', blockController_1.listBlocks);
exports.blockRouter.post('/', blockController_1.createBlock);
exports.blockRouter.put('/:id', blockController_1.updateBlock);
exports.blockRouter.delete('/:id', blockController_1.deleteBlock);
//# sourceMappingURL=blockRoutes.js.map