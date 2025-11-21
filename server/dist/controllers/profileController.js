"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrganisation = exports.updateProfile = exports.getProfile = void 0;
const User_1 = require("../models/User");
const Organisation_1 = require("../models/Organisation");
const password_1 = require("../utils/password");
const getProfile = async (req, res) => {
    const user = await User_1.UserModel.findById(req.user.id).select('-password');
    res.json(user);
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const { name, phone, password } = req.body;
    const payload = {};
    if (name)
        payload.name = name;
    if (phone)
        payload.phone = phone;
    if (password)
        payload.password = await (0, password_1.hashPassword)(password);
    const user = await User_1.UserModel.findByIdAndUpdate(req.user.id, payload, { new: true }).select('-password');
    res.json(user);
};
exports.updateProfile = updateProfile;
const updateOrganisation = async (req, res) => {
    const { name, contactEmail, contactPhone, timezone } = req.body;
    const org = await Organisation_1.OrganisationModel.findByIdAndUpdate(req.user.organisationId, { name, contactEmail, contactPhone, timezone }, { new: true });
    res.json(org);
};
exports.updateOrganisation = updateOrganisation;
//# sourceMappingURL=profileController.js.map