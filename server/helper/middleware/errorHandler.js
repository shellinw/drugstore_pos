const errorHandle = (err, req, res, next) => {
    let status = 500;
    let message = "Internal Server Error";

    if (err.message === "Field Required") {
        status = 400;
        message = `Username, Password and Role is Required`;
    }
    if (err.message === "Password Minimal 5 char") {
        status = 400;
        message = `Min Password Char 5`;
    }
    if (err.message === "User Not Found") {
        status = 400;
        message = `User Not Found`;
    }
    if (err.message === "OrderDetail Not Found") {
        status = 400;
        message = `No order detail is registered`;
    }
    if (err.message === "Order Not Found") {
        status = 400;
        message = `Order Not Found`;
    }
    if (err.message === "Name Already Exist") {
        status = 400;
        message = `Please Use A Different Name`;
    }
    if (err.message === "Batch Not Found") {
        status = 400;
        message = `Batch Not Found`;
    }
    if (err.message === "Authentication Fail") {
        status = 400;
        message = `User Not Found`;
    }
    if (err.message === "Insufficient Batch Stock") {
        status = 400;
        message = `Insufficient Stock from chosen batch`;
    }
    if (err.message === "Product Not Found") {
        status = 400;
        message = "Product Not Found";
    }
    if (err.message === "Login Fail") {
        status = 400;
        message = "Username/Password Invalid";
    }
    if (err.message === "Username already exist") {
        status = 400;
        message = `Username already exist`;
    }
    if (err.message === "Incomplete Batch Information") {
        status = 400;
        message = `Please complete the required field`;
    }
    if (err.message === "Please Input Qty") {
        status = 400;
        message = `Please input Qty`;
    }
    if (err.message === "Product Unavailable") {
        status = 400;
        message = `Product Unavailable For Sale`;
    }
    if (err.message === "Please Specify Unit Correctly") {
        status = 401;
        message = `Specify Unit`;
    }
    if (
        err.message === "UnitType 'Box' cannot have size specified." ||
        err.message === "UnitType must be 'Box' for strip/tab counts." ||
        err.message ===
            "Please specify both stripCount and tabCount for 'Box' unitType."
    ) {
        status = 401;
        message = `Wrong UnitType`;
    }
    if (err.message === "You have no acess to add product") {
        status = 403;
        message = `Authority Breech`;
    }
    if (err.message === "Order Cannot Be Hold") {
        status = 400;
        message = `Order Cannot Be Hold. Only Order Status processing can be hold.`;
    }
    if (
        err.message ===
        "Product already exists with the same name,dosage and manufacturer. BOX"
    ) {
        status = 403;
        message = `BOX- Product already exists with the same name,dosage and manufacturer.`;
    }
    if (err.message === "Order Cannot Be Process") {
        status = 400;
        message = `Order Status isn't open`;
    }
    if (err.message === "NO ITEM") {
        status = 400;
        message = `NO ITEM IN CART`;
    }
    if (err.message === "Payment Detail Incomplete") {
        status = 400;
        message = `Incomplete Payment Detail`;
    }
    if (err.message === "No Item") {
        status = 400;
        message = "NO ITEM ON CART";
    }
    if (err.message === "Order must be proccessing in order to be dispatch.") {
        status = 400;
        message = "CANNOT DISPATCH, STATUS MUST BE PROCCESSING ONLY";
    }

    if (
        err.message ===
        "Product already exists with the same name,dosage and manufacturer."
    ) {
        status = 400;
        message = `NAME,DOSAGE AND MANUFACTURER ALREADY EXIST`;
    }
    if (
        err.message === "Product already exists with the same dosage and size."
    ) {
        status = 400;
        message = `DOSAGE AND SIZE EXISTS`;
    }
    if (
        err.message === "Product already exists with the same name and dosage."
    ) {
        status = 400;
        message = `Product already exists with the same name and dosage.`;
    }
    if (err.message === "Order Receipt Unmatch") {
        status = 400;
        message = "ORDER RECEIPT INVALID";
    }
    if (err.message === "No Receipt Found") {
        status = 400;
        message = "RECEIPT NOT FOUND";
    }
    if (
        err.message ===
        "Product already exists with the same manufacturer and dosage"
    ) {
        status = 400;
        message = `Error Cok`;
    }
    if (err.errors?.role?.properties) {
        status = 400;
        message = err.errors.role?.properties?.message;
    }
    if (err.name === "CastError") {
        status = 400;
        message = `Received${err.stringValue},whislt type must be ${err.kind}`;
    }
    if (err.name === "ValidationError") {
        status = 403;
        Object.keys(err.errors).forEach((path) => {
            return (message = `Validation error occurred at path:${path}`);
        });
    }

    res.status(status).json({ message });
};
module.exports = errorHandle;
