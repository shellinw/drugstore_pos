const bcrypt = require("bcrypt");

const SECRETKEY = 5;

const hashMe = (plainTextPassword) => {
    return bcrypt.hashSync(plainTextPassword, SECRETKEY);
};

const comparePassword = (insertedPassword, hashMe) => {
    return bcrypt.compareSync(insertedPassword, hashMe);
};

module.exports = { hashMe, comparePassword };
