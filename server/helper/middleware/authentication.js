const { User } = require("../../Model");
const { decodeToken } = require("../jwt");

const authenticateUser = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        const token = authorization.split(" ")[1];
        const payload = decodeToken(token);
        const checkUser = await User.findOne({ username: payload.username });
        if (!checkUser) {
            throw new Error("Authentication Fail");
        }

        req.login = {
            username: payload.username,
            role: payload.role,
        };
        next();
    } catch (error) {
        next(error);
    }
};
module.exports = authenticateUser;
