"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlock = exports.updateBlock = exports.createBlock = exports.listBlocks = void 0;
const Block_1 = require("../models/Block");
const blockValidators_1 = require("../validators/blockValidators");
const errorHandler_1 = require("../middleware/errorHandler");
const listBlocks = async (req, res) => {
    const blocks = await Block_1.BlockModel.find({ organisation: req.user.organisationId });
    res.json(blocks);
};
exports.listBlocks = listBlocks;
const createBlock = async (req, res) => {
    const data = blockValidators_1.blockSchema.parse(req.body);
    const block = await Block_1.BlockModel.create({
        organisation: req.user.organisationId,
        ...data,
    });
    res.status(201).json(block);
};
exports.createBlock = createBlock;
const updateBlock = async (req, res) => {
    const data = blockValidators_1.blockSchema.partial().parse(req.body);
    const block = await Block_1.BlockModel.findOneAndUpdate({ _id: req.params.id, organisation: req.user.organisationId }, data, { new: true });
    if (!block)
        throw new errorHandler_1.HttpError(404, 'Block not found');
    res.json(block);
};
exports.updateBlock = updateBlock;
const deleteBlock = async (req, res) => {
    await Block_1.BlockModel.deleteOne({ _id: req.params.id, organisation: req.user.organisationId });
    res.status(204).end();
};
exports.deleteBlock = deleteBlock;
//# sourceMappingURL=blockController.js.map