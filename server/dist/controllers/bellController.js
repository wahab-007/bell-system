"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBell = exports.updateBell = exports.createBell = exports.listBells = void 0;
const crypto_1 = require("crypto");
const Bell_1 = require("../models/Bell");
const Block_1 = require("../models/Block");
const bellValidators_1 = require("../validators/bellValidators");
const errorHandler_1 = require("../middleware/errorHandler");
const listBells = async (req, res) => {
    const bells = await Bell_1.BellModel.find({ organisation: req.user.organisationId }).populate('block');
    res.json(bells);
};
exports.listBells = listBells;
const createBell = async (req, res) => {
    const data = bellValidators_1.bellSchema.parse(req.body);
    const block = await Block_1.BlockModel.findOne({ _id: data.blockId, organisation: req.user.organisationId });
    if (!block)
        throw new errorHandler_1.HttpError(404, 'Block not found');
    const bell = await Bell_1.BellModel.create({
        organisation: req.user.organisationId,
        block: block._id,
        label: data.label,
        deviceId: data.deviceId,
        capabilities: data.capabilities ?? [],
        pingSecret: (0, crypto_1.randomUUID)(),
    });
    res.status(201).json(bell);
};
exports.createBell = createBell;
const updateBell = async (req, res) => {
    const data = bellValidators_1.bellSchema.partial().parse(req.body);
    const bell = await Bell_1.BellModel.findOneAndUpdate({ _id: req.params.id, organisation: req.user.organisationId }, data, { new: true });
    if (!bell)
        throw new errorHandler_1.HttpError(404, 'Bell not found');
    res.json(bell);
};
exports.updateBell = updateBell;
const deleteBell = async (req, res) => {
    await Bell_1.BellModel.deleteOne({ _id: req.params.id, organisation: req.user.organisationId });
    res.status(204).end();
};
exports.deleteBell = deleteBell;
//# sourceMappingURL=bellController.js.map