const authorization = async (req, res, next) => {
    try {
        const { username, role } = req.login;
        if (role !== "superadmin") {
            throw new Error("You have no acess to add product");
        }
        next();
    } catch (error) {
        next(error);
        console.log(error);
    }
};
module.exports = authorization;
