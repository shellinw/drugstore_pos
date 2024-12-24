const port = 3000;
const express = require("express");
const app = express();
const Controller = require("./Controller");
const moongoes = require("mongoose");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const errorHandle = require("./helper/middleware/errorHandler");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ credentials: true, origin: "http://localhost:3001" }));
const authenticateUser = require("./helper/middleware/authentication");
const authorization = require("./helper/middleware/authorization");

async function connectToDatabase() {
    try {
        await moongoes.connect(
            "mongodb+srv://shellinw:mongodbpassword@phase3.mzfd8gt.mongodb.net/DatabaseOne"
        );
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        // Optionally, you can throw the error or handle it further here
        console.log(error);
    }
}

connectToDatabase();

//API Endpoint
//registration
app.post("/register", Controller.register); //checked

app.post("/login", Controller.login); //checked

app.use(authenticateUser); //checked

app.get("/allproduct", Controller.getProducts); //checked
app.get("/product/:id", Controller.getProductById); //checked
app.post("/newproduct", authorization, Controller.postNewProduct); //checked
app.put("/product/:id", authorization, Controller.update); //checked
app.put(
    "/product/:id/batch/:batchId",
    authorization,
    Controller.deactivateBatch
);

app.post("/addStock", authorization, Controller.addStock); //checked
app.patch("/product/:id", authorization, Controller.deactivateProduct); //checked
app.delete("/product/:id", authorization, Controller.delete); //checked

app.get("/order", Controller.getOrder);
app.get("/order/:id", Controller.getOrderById);
app.get("/order/:id/receipt/:receiptId", Controller.getPaymentDetail);
app.put("/order/:id", Controller.takeOrder);
app.patch("/order/:id", Controller.orderDetail);
app.put("/order/:id/editDisc", Controller.itemDiscount);
app.delete("/order/:id/OrderDetail/:orderDetailId", Controller.deleteCartItem);

app.post("/createOrder", Controller.createOrder);
app.put("/transaction", Controller.transaction); // mock api for testing.
// app.put("/createOrder/:id", Controller.takeOrder);
app.put("/closeOrder/:id", Controller.closeOrder);

app.delete("/cancelOrder/:id", Controller.cancelOrder);
app.patch("/holdProcess/:id", Controller.holdProcess);
app.patch("/processOrder/:id", Controller.processOrder);
app.patch("/orderDone/:id", Controller.orderDone);

app.get("/membership", Controller.getMembers);
app.post("/membership", Controller.newMember);
app.post("/notification", Controller.notification);

app.use(errorHandle);
app.listen(port, (error) => {
    if (!error) {
        console.log(`Listening at port ${port}`);
    } else {
        console.log(error);
        console.log(`Error: ${error}`);
    }
});
