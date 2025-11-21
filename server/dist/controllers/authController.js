"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = exports.login = exports.signup = void 0;
const authValidators_1 = require("../validators/authValidators");
const Organisation_1 = require("../models/Organisation");
const User_1 = require("../models/User");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("../middleware/errorHandler");
const EmergencyState_1 = require("../models/EmergencyState");
const slugify = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
const signup = async (req, res) => {
    const data = authValidators_1.signupSchema.parse(req.body);
    const slug = slugify(data.organisationName);
    const organisation = await Organisation_1.OrganisationModel.create({
        name: data.organisationName,
        slug,
        timezone: data.timezone,
        contactEmail: data.email,
        contactPhone: data.phone,
    });
    const password = await (0, password_1.hashPassword)(data.password);
    const user = await User_1.UserModel.create({
        organisation: organisation._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password,
        role: 'owner',
    });
    await EmergencyState_1.EmergencyStateModel.create({
        organisation: organisation._id,
        active: false,
    });
    const payload = {
        id: user._id.toString(),
        organisationId: organisation._id.toString(),
        role: user.role,
        email: user.email,
    };
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)(payload);
    res.status(201).json({ user: payload, organisation, accessToken, refreshToken });
};
exports.signup = signup;
const login = async (req, res) => {
    const data = authValidators_1.loginSchema.parse(req.body);
    const user = await User_1.UserModel.findOne({ email: data.email }).populate('organisation');
    if (!user)
        throw new errorHandler_1.HttpError(401, 'Invalid credentials');
    const valid = await (0, password_1.comparePassword)(data.password, user.password);
    if (!valid)
        throw new errorHandler_1.HttpError(401, 'Invalid credentials');
    const payload = {
        id: user._id.toString(),
        organisationId: user.organisation.toString(),
        role: user.role,
        email: user.email,
    };
    res.json({
        user: payload,
        organisation: user.organisation,
        accessToken: (0, jwt_1.signAccessToken)(payload),
        refreshToken: (0, jwt_1.signRefreshToken)(payload),
    });
};
exports.login = login;
const refresh = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        throw new errorHandler_1.HttpError(401, 'Missing refresh token');
    const payload = (0, jwt_1.verifyRefresh)(refreshToken);
    res.json({
        accessToken: (0, jwt_1.signAccessToken)(payload),
    });
};
exports.refresh = refresh;
//# sourceMappingURL=authController.js.map