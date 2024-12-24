const jwt = require("jsonwebtoken");
const SECRET = "randomize";
const genToken = (payload) => {
    return jwt.sign(payload, SECRET);
};

const decodeToken = (token) => {
    return jwt.verify(token, SECRET);
};
module.exports = { genToken, decodeToken };
