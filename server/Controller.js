const {
    Product,
    User,
    OrderDetail,
    Inventory_Batch,
    Order,
    Customer,
    PaymentReceipts,
    Notif,
} = require("./Model");

const { hashMe, comparePassword } = require("./helper/bcrypt");
const { genToken } = require("./helper/jwt");
const { MongoClient, ObjectId } = require("mongodb");
const client = new MongoClient(
    "mongodb+srv://shellinw:mongodbpassword@phase3.mzfd8gt.mongodb.net/DatabaseOne"
);

class Controller {
    static async register(req, res, next) {
        try {
            const { email, password, username, role } = req.body;

            if (!password || !username) {
                throw new Error("Field Required");
            }
            if (password.length < 5) {
                throw new Error("Password Minimal 5 char");
            }

            const checkDup = await User.findOne({ username });
            if (checkDup) {
                throw new Error("Username already exist");
            }

            await User.create({
                username,
                email,
                role,
                password: hashMe(password),
            });
            console.log("Registered");

            res.status(201).json({
                Message: `Success adding account ${username}`,
            });
        } catch (error) {
            next(error);
        }
    }

    static async login(req, res, next) {
        try {
            const { password, username } = req.body;
            if (!password || !username) {
                throw new Error("Field Required");
            }

            const checkUser = await User.findOne({
                username,
            });
            if (!checkUser) {
                throw new Error("User Not Found");
            }
            const verifyPassword = comparePassword(
                password,
                checkUser.password
            );
            if (!verifyPassword) {
                throw new Error("Login Fail");
            }
            const payload = {
                id: checkUser.id,
                username: checkUser.username,
                role: checkUser.role,
            };
            const token = genToken(payload);

            res.status(201).json({
                Message: `Success Login account ${username}`,
                Token: `${token}`,
                User: `${username}`,
                Role: `${checkUser.role}`,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            const product = await Product.findById(id).populate("inventory");

            if (!product || product.length === 0) {
                throw new Error("Product Not Found");
            }

            let totalCount = 0; // Initialize totalCount outside the loop
            for (let i = 0; i < product.inventory.length; i++) {
                totalCount += product.inventory[i].quantity;
            }
            res.json({
                Message: `Success`,
                total: totalCount,
                data: product,
            });
        } catch (error) {
            next(error);
        }
    }
    static async getProducts(req, res, next) {
        try {
            const { search } = req.query;

            let products;

            if (search) {
                // Construct a case-insensitive regular expression for the search term
                const regex = new RegExp(search.replace(/\s+/g, "\\s*"), "i");
                products = await Product.find({ name: regex })
                    .sort({
                        expired_date: 1,
                    })
                    .populate("inventory");
            } else {
                products = await Product.find().populate("inventory");
            }
            res.json({
                success: true,
                message: "Success Fetching Product",
                Item_Count: products.length,
                data: products,
            });
        } catch (error) {
            next(error);
        }
    }

    static async update(req, res, next) {
        try {
            const { id } = req.params;

            const { name, manufacturer, dosage, status, unit, description } =
                req.body;

            //find the intented product data.
            const product = await Product.findById({ _id: id });

            if (!product) {
                throw new Error("Product Not Found");
            }
            await product.updateOne({
                name,
                manufacturer,
                dosage,
                status,
                unit,
                description,
            });
            const checkTrue = await Product.findById({ _id: product._id });
            res.json({
                success: true,
                previousData: product,
                new: checkTrue,
            });
        } catch (error) {
            next(error);
        }
    }

    static async postNewProduct(req, res, next) {
        try {
            const {
                name,
                manufacturer,
                dosage,
                status,
                unitType,
                description,
                stripCount,
                tabCount,
                size,
            } = req.body;

            // Check if product with same name and manufacturer exists
            if (unitType !== "Box") {
                const existingProduct = await Product.findOne({
                    name,
                    manufacturer,
                    dosage,
                    "unit.details.size": size,
                });

                if (existingProduct) {
                    throw new Error(
                        "Product already exists with the same name,dosage and manufacturer."
                    );
                }
            }
            if (unitType === "Box") {
                const BoxExist = await Product.findOne({
                    name,
                    manufacturer,
                    dosage,
                    "unit.type": unitType,
                    "unit.details.numberOfStrips": stripCount,
                    "unit.details.numberOfTabs": tabCount,
                });

                if (BoxExist) {
                    throw new Error(
                        "Product already exists with the same name,dosage and manufacturer. BOX"
                    );
                }
            }
            // Validate unit details based on unitType
            let unit;
            if (size) {
                if (unitType === "Box") {
                    throw new Error(
                        "UnitType 'Box' cannot have size specified."
                    );
                }
                unit = {
                    type: unitType,
                    details: { size },
                };
            } else {
                if (unitType !== "Box") {
                    throw new Error(
                        "UnitType must be 'Box' for strip/tab counts."
                    );
                }
                if (!stripCount || !tabCount) {
                    throw new Error(
                        "Please specify both stripCount and tabCount for 'Box' unitType."
                    );
                }
                unit = {
                    type: unitType,
                    details: {
                        numberOfStrips: stripCount,
                        numberOfTabs: tabCount,
                    },
                };
            }

            const product = new Product({
                name,
                manufacturer,
                dosage,
                status,
                unit,
                description,
            });

            await product.save();
            res.json({
                success: true,
                data: product,
            });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const product = await Product.findById({ _id: id });

            if (!product) {
                throw new Error("Product Not Found");
            }
            await Product.deleteOne({ _id: product._id });
            res.json({
                message: `Product has been deleted`,
                deleted: product,
            });
        } catch (error) {
            next(error);
        }
    }

    static async addStock(req, res, next) {
        try {
            const {
                productId,
                quantity,
                price,
                batchNumber,
                expired_date,
                intake_date,
                discRate,
            } = req.body;
            if (
                !productId ||
                !quantity ||
                !price ||
                !batchNumber ||
                !expired_date ||
                !intake_date
            ) {
                throw new Error("Incomplete Batch Information");
            }
            //find product by Id

            const checkproduct = await Product.findOne({ _id: productId });
            if (!checkproduct) {
                throw new Error("Product Not Found");
            }

            const newInventory = await Inventory_Batch.create({
                productId: productId,
                quantity,
                price,
                batchNumber,
                expired_date,
                intake_date,
                discRate,
            });

            checkproduct.inventory.push(newInventory._id);
            await checkproduct.save();
            console.log("Stock Added");
            const checkTrue = await Inventory_Batch.findOne({
                _id: newInventory._id,
            });

            res.json({
                Message: "Stock Added",
                Current: checkproduct,
                NewInput: checkTrue,
            });
        } catch (error) {
            next(error);
        }
    }

    static async deactivateProduct(req, res, next) {
        try {
            const { state } = req.body;
            const { id } = req.params;

            const findProduct = await Product.findById(id);
            if (!findProduct) {
                throw new Error("Product Not Found");
            }
            await findProduct.updateOne({
                status: state,
            });
            await findProduct.save();

            const checkTrue = await Product.findById(id);
            res.json({
                Message: `Product has been${state}`,
                Data: checkTrue,
            });
        } catch (error) {
            next(error);
        }
    }

    static async deactivateBatch(req, res, next) {
        try {
            const { status } = req.body;
            const { id, batchId } = req.params;

            const findProduct = await Product.findById(id);
            if (!findProduct) {
                throw new Error("Product Not Found");
            }
            const findBatch = await Inventory_Batch.findById(batchId);
            if (!findBatch) {
                throw new Error("Batch Not Found");
            }
            await findBatch.updateOne({ batchStatus: status });
            const checkTrue = await Inventory_Batch.findById(findBatch._id);
            res.json({
                Message: `Batch is now ${status}`,
                Data: checkTrue,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getOrder(req, res, next) {
        try {
            const { search, filter, sort } = req.query;
            let query = {};

            if (search) {
                const regex = new RegExp(search.replace(/\s+/g, "\\s*"), "i");
                query.customer = regex;
            }

            if (
                filter === "Open" ||
                filter === "Closed" ||
                filter === "Hold" ||
                filter === "Proccesing"
            ) {
                query.orderStatus = filter;
            }

            const sortOption = {};

            if (sort === "latest") {
                sortOption.date = -1; // Sort by descending order of date (latest first)
            } else if (sort === "oldest") {
                sortOption.date = 1; // Sort by ascending order of date (oldest first)
            }

            const orders = await Order.find(query)
                .sort(sortOption)
                .populate({
                    path: "orderDetails",
                    populate: [
                        {
                            path: "productId",
                            select: "name dosage unit", // This selects only the 'name' field of the product
                        },
                        {
                            path: "batchId",
                            select: "price batchNumber", // This selects only the 'name' field of the product
                        },
                    ],
                });
            res.json({
                Message: "Success",
                Data: orders,
            });
        } catch (error) {
            next(error);
        }
    }
    static async getOrderById(req, res, next) {
        try {
            const { id } = req.params;
            const order = await Order.findById(id)
                .populate({
                    path: "orderDetails",
                    populate: [
                        {
                            path: "productId",
                            select: "name dosage unit",
                        },
                        {
                            path: "batchId",
                            select: "price",
                        },
                    ],
                })
                .populate("customer");
            res.json({
                Message: "Success",
                Data: order,
            });
        } catch (error) {
            next(error);
        }
    }
    static async createOrder(req, res, next) {
        try {
            const { username } = req.login;
            const newOrder = await Order.create({
                salesPerson: username,
            });
            res.json({
                Message: "Opened Order",
                Data: newOrder,
            });
        } catch (error) {
            next(error);
        }
    }
    static async orderDetail(req, res, next) {
        const { id } = req.params;
        const { batchId, productId, quantity, discRate } = req.body;
        if (quantity === undefined || quantity === null || quantity == 0) {
            const error = new Error("Please Input Qty");
            console.error("Validation error:", error);
            return next(error);
        }
        const session = client.startSession();
        const transactionOptions = {
            readPreference: "primary",
            readConcern: { level: "local" },
            writeConcern: { w: "majority" },
        };
        try {
            const transactionResult = await session.withTransaction(
                async () => {
                    const ordersCollection = client
                        .db("DatabaseOne")
                        .collection("orderschemas");
                    const productsCollection = client
                        .db("DatabaseOne")
                        .collection("products");
                    const inventoriesCollection = client
                        .db("DatabaseOne")
                        .collection("inventories");
                    const orderDetailsCollection = client
                        .db("DatabaseOne")
                        .collection("orderdetails");

                    // Find the order by id
                    const checkOrder = await ordersCollection.findOne({
                        _id: new ObjectId(id),
                    });

                    if (!checkOrder) {
                        throw new Error("Order Not Found");
                    }

                    // Find the product by productId
                    const checkProduct = await productsCollection.findOne({
                        _id: new ObjectId(productId),
                    });

                    if (!checkProduct) {
                        throw new Error("Product Not Found");
                    }

                    // Find the batch by batchId
                    const checkBatch = await inventoriesCollection.findOne({
                        _id: new ObjectId(batchId),
                    });

                    if (!checkBatch) {
                        throw new Error("Batch Not Found");
                    }

                    if (checkBatch.batchStatus === "Unavailable") {
                        throw new Error("Batch Not Available");
                    }

                    if (checkBatch.quantity < quantity) {
                        throw new Error("Insufficient Batch Stock");
                    }

                    // Update inventory quantity
                    await inventoriesCollection.updateOne(
                        { _id: new ObjectId(batchId) },
                        { $inc: { quantity: -quantity } },
                        { session }
                    );

                    console.log("Document Inventory has been Updated");

                    // Calculate subtotal
                    const subtotal = quantity * checkBatch.price;

                    // Create new order detail
                    const newOrderDetail = {
                        batchId: batchId,
                        productId: productId,
                        quantity: quantity,
                        discRate: discRate,
                        subtotal: subtotal,
                    };

                    const updatedOrderDetail =
                        await orderDetailsCollection.insertOne(newOrderDetail, {
                            session,
                        });

                    console.log(
                        "Document Order Detail has been created",
                        updatedOrderDetail
                    );

                    // Update order with new order detail
                    const appendedOrderDetail =
                        await ordersCollection.updateOne(
                            { _id: new ObjectId(id) },
                            {
                                $push: {
                                    orderDetails: updatedOrderDetail.insertedId,
                                },
                            },
                            { session }
                        );

                    console.log("Order Detail appended to Order");

                    return appendedOrderDetail;
                },
                transactionOptions
            );

            console.log("Transaction Result:", transactionResult);

            res.json({
                Message: `Updated Order Added`,
                Data: transactionResult,
            });
        } catch (error) {
            console.error("Transaction error:", error);
            next(error); // Pass error to error handler middleware
        } finally {
            await session.endSession();
        }
    }

    static async transaction(req, res, next) {
        const userData = {
            username: "klop",
            password: "12345",
        };
        const session = client.startSession();
        const transactionOptions = {
            readPreference: "primary",
            readConcern: { level: "local" },
            writeConcern: { w: "majority" },
        };
        try {
            const transactionResult = await session.withTransaction(
                async () => {
                    const userCollection = client
                        .db("DatabaseOne")
                        .collection("users");
                    const newData = await userCollection.insertOne(userData, {
                        session,
                    });
                    console.log("new data created", newData);
                    const checkDta = await userCollection.findOne(
                        {
                            _id: newData.insertedId,
                        },
                        { session }
                    );
                    if (!checkDta) {
                        throw new Error("Not Found");
                    }
                    console.log("Document Insertion Success", checkDta);

                    return checkDta;
                },
                transactionOptions
            );
            res.json({
                Message: "Success",
                Data: transactionResult,
            });
        } catch (error) {
            console.error("Transaction error:", error);
            console.error("Aborted Transaction", error);
            next(error);
        } finally {
            await session.endSession();
        }
    }

    static async takeOrder(req, res, next) {
        try {
            const { id } = req.params;
            const {
                paymentVia,
                orderType,
                salesPerson,
                customer,
                phoneNumber,
                customerId,
            } = req.body;

            const checkOrder = await Order.findById({ _id: id });
            if (!checkOrder) {
                throw new Error("Order Not Found");
            }
            let updateFormat = {
                paymentVia,
                orderType,
                phoneNumber,
                salesPerson,
            };
            const checkMember = await Customer.findById(customerId);
            if (checkMember) {
                updateFormat = {
                    paymentVia,
                    orderType,
                    customerName: checkMember.fullName,
                    phoneNumber,
                    salesPerson,
                    customer: checkMember._id,
                };
            } else {
                updateFormat = {
                    paymentVia,
                    orderType,
                    phoneNumber,
                    salesPerson,
                    customerName: customer,
                };
            }

            await checkOrder.updateOne(updateFormat);
            const checkTrue = await Order.findById(checkOrder._id);
            const result = await Order.findById(checkTrue._id)
                .populate({
                    path: "orderDetails",
                    populate: [
                        {
                            path: "productId",
                            select: "name", // This selects only the 'name' field of the product
                        },
                        {
                            path: "batchId",
                            select: "price", // This selects only the 'name' field of the product
                        },
                    ],
                })
                .populate({
                    path: "customer",
                });

            res.json({
                Message: "Updated Order",
                Data: result,
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    // static async orderDetail(req, res, next) {
    //     try {
    //         const { id } = req.params;
    //         const { batchId, productId, quantity, discRate } = req.body;
    //         const orderData = await Order.findById(id);
    //         const batchData = await Inventory_Batch.findById(batchId);
    //         const productData = await Product.findById(productId);

    //         if (!orderData) {
    //             throw new Error("Order Not Found");
    //         }
    //         if (!batchData) {
    //             throw new Error("Batch Not Found");
    //         }
    //         if (!productData) {
    //             throw new Error("Product Not Found");
    //         }
    //         if (productData.status === "Deactivate") {
    //             throw new Error("Product Unavailable");
    //         }
    //         if (!quantity) {
    //             throw new Error("Please input quantity");
    //         }
    //         if (batchData.quantity < quantity) {
    //             throw new Error("Insufficient Batch Stock");
    //         }
    //         let countSub = batchData.price * quantity;
    //         if (!discRate) {
    //             discRate === 0;
    //         }
    //         let discAmount = countSub * discRate;
    //         let afterDis = countSub - discAmount;
    //         await batchData.updateOne({
    //             quantity: batchData.quantity - quantity,
    //         });

    //         const newDetail = await OrderDetail.create({
    //             batchId: batchId,
    //             productId: productId,
    //             quantity,
    //             discRate,
    //             subtotal: afterDis,
    //         });

    //         const checkOrderDetail = await OrderDetail.findById(newDetail._id);

    //         orderData.orderDetails.push(newDetail._id);

    //         await orderData.save();
    //         const checkResult = await Order.findById(orderData._id);

    //         res.json({
    //             Message: `Updated Order Added${productData.name}`,
    //             Data: checkResult,
    //         });
    //     } catch (error) {
    //         console.log(error);
    //         next(error);
    //     }
    // }

    static async itemDiscount(req, res, next) {
        try {
            console.log("triggered new static<<<<<<<<<<<<<<<<<<<");
            console.log(req.body);
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
    static async deleteCartItem(req, res, next) {
        try {
            const { id, orderDetailId } = req.params;

            const orderData = await Order.findById(id);
            if (!orderData) {
                throw new Error("Order Not Found");
            }

            const orderDetailData = await OrderDetail.findById(orderDetailId);
            if (!orderDetailData) {
                throw new Error("OrderDetail Not Found");
            }

            await orderDetailData.deleteOne();

            const getBatch = await Inventory_Batch.findById(
                orderDetailData.batchId
            );

            // console.log(getBatch, "before return");

            await getBatch.updateOne({
                quantity: getBatch.quantity + orderDetailData.quantity,
            });

            // Use filter to remove the specific ObjectId from the array
            const indexToRemove = orderData.orderDetails.findIndex((objectId) =>
                objectId.equals(orderDetailId)
            );

            // If the ObjectId is found, remove it from the array
            if (indexToRemove !== -1) {
                orderData.orderDetails.splice(indexToRemove, 1);
            }

            await orderData.save();

            const checkchange = await Inventory_Batch.findById(getBatch._id);
            // console.log(checkchange, "after return");

            res.json({
                Message: `Deleted Order Added${orderDetailId}}`,
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    static async closeOrder(req, res, next) {
        try {
            const { id } = req.params;
            const { total, customerId } = req.body;
            const {
                dataHere: { paymentProof, paymentMethod, paymentMerchant },
            } = req.body;
            const choosenOrder = await Order.findById(id);

            if (choosenOrder.orderStatus === "Closed") {
                res.json({
                    Message: "Bill Has Been Closed",
                });
            }

            if (choosenOrder.orderDetails.length === 0) {
                throw new Error("NO ITEM");
            }

            const TaxAmount = total * 0.1;

            if (!paymentProof || !total || !paymentMethod) {
                throw new Error("Payment Detail Incomplete");
            }
            const newReceipt = await PaymentReceipts.create({
                paymentMethod,
                paymentAmount: TaxAmount + total,
                paymentStatus: "completed",
                paymentProof,
                customerId,
                paymentMerchant,
                orderId: id,
            });
            await choosenOrder.updateOne({
                orderStatus: "Closed",
                totalPrice: TaxAmount + total,
                paymentDetail: newReceipt._id,
            });
            await choosenOrder.save();

            const afterClose = await Order.findById({
                _id: id,
            });

            const BillData = {
                OrderDetail: afterClose,
                Subtotal: `Rp ${total}`,
                Tax: `Rp ${TaxAmount}`,
                TotalAfterTax: `Rp ${total + TaxAmount}`,
                Receipt: newReceipt,
            };

            console.log(BillData, "INI DIA BILL DATA");

            res.json({
                Message: "Billed Closed",
                Data: BillData,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getPaymentDetail(req, res, next) {
        try {
            const { id, receiptId } = req.params;

            const checkOrder = await Order.findById(id);
            const checkReceipt = await PaymentReceipts.findById(receiptId);

            if (!checkOrder) {
                throw new Error("Order Not Found");
            } else if (checkOrder) {
                if (String(checkOrder.paymentDetail) !== receiptId) {
                    throw new Error("Order Receipt Unmatch");
                } else if (!checkOrder.paymentDetail) {
                    throw new Error("No Receipt Found");
                }
            }

            const receiptDetail = await Order.findById(id)
                .populate({
                    path: "orderDetails",
                    populate: [
                        {
                            path: "productId",
                            select: "name dosage unit",
                        },
                        {
                            path: "batchId",
                            select: "price",
                        },
                    ],
                })
                .populate("customer")
                .populate("paymentDetail");
            console.log(receiptDetail);
            res.json({
                Message: "Success",
                Data: receiptDetail,
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    static async processOrder(req, res, next) {
        try {
            const { id } = req.params;
            const checkOrder = await Order.findById(id);
            if (!checkOrder) {
                throw new Error("Order Not Found");
            }
            if (checkOrder.orderDetails.length === 0) {
                throw new Error("No Item");
            }
            if (checkOrder.orderStatus === "Proccessing") {
                throw new Error("Order Cannot Be Process");
            }
            await checkOrder.updateOne({ orderStatus: "Proccesing" });
            const checkTrue = await Order.findById(checkOrder._id);
            res.json({
                Message: "Order Processed",
                data: checkTrue,
            });
        } catch (error) {
            next(error);
        }
    }
    static async orderDone(req, res, next) {
        try {
            const { id } = req.params;
            const checkOrder = await Order.findById(id);
            if (!checkOrder) {
                throw new Error("Order Not Found");
            }
            if (checkOrder.orderDetails.length === 0) {
                throw new Error("No Item");
            }
            if (checkOrder.orderStatus !== "Proccesing") {
                throw new Error(
                    "Order must be proccessing in order to be dispatch."
                );
            }
            await checkOrder.updateOne({ orderStatus: "Done" });
            const checkTrue = await Order.findById(checkOrder._id);
            res.json({
                Message: "Order Processed",
                data: checkTrue,
            });
        } catch (error) {
            next(error);
        }
    }

    static async holdProcess(req, res, next) {
        try {
            const { id } = req.params;
            const checkOrder = await Order.findById(id);
            if (!checkOrder) {
                throw new Error("Order Not Found");
            }

            if (checkOrder.orderStatus !== "Proccesing") {
                throw new Error("Order Cannot Be Hold");
            }
            await checkOrder.updateOne({ orderStatus: "Hold" });
            const checkTrue = await Order.findById(checkOrder._id);
            res.json({
                Message: "Order Hold",
                data: checkTrue,
            });
        } catch (error) {
            next(error);
        }
    }

    static async cancelOrder(req, res, next) {
        try {
            const { id } = req.params;
            const choosenOrder = await Order.findById(id);
            if (!choosenOrder) {
                throw new Error("Order Not Found");
            }
            if (choosenOrder.orderDetails.length !== 0) {
                for (let i = 0; i < choosenOrder.orderDetails.length; i++) {
                    const details = await OrderDetail.findById(
                        choosenOrder.orderDetails[i]
                    );
                    const choosenBatch = await Inventory_Batch.findById(
                        details.batchId
                    );

                    // Update the quantity of the batch
                    await choosenBatch.updateOne({
                        quantity: choosenBatch.quantity + details.quantity,
                    });

                    // Delete the OrderDetail document
                    await OrderDetail.findByIdAndDelete(
                        choosenOrder.orderDetails[i]
                    );
                }
            }

            // Clear the orderDetails array of the order
            await choosenOrder.updateOne({ orderDetails: [] });
            //delete order.
            await Order.findByIdAndDelete(choosenOrder._id);
            res.json({
                Message: "Order Cancelled",
                data: choosenOrder,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getMembers(req, res, next) {
        try {
            const { search } = req.query;
            let members;
            if (search) {
                const regex = new RegExp(search.replace(/\s+/g, "\\s*"), "i");
                members = await Customer.find({ fullName: regex });
            } else {
                members = await Customer.find();
            }
            res.json({
                Message: "Retrieved Membership Data",
                data: members,
            });
        } catch (error) {
            next(error);
        }
    }

    static async newMember(req, res, next) {
        try {
            const { fullName, dob, phoneNumber, address, points } = req.body;
            const checkDup = await Customer.findOne({ fullName: fullName });
            if (!checkDup) {
                await Customer.create({
                    fullName,
                    dob,
                    phoneNumber,
                    address,
                    points,
                });
            } else {
                throw new Error("Name Already Exist");
            }
            res.json({
                Message: "New Membership",
            });
        } catch (error) {
            next(error);
        }
    }

    static async notification(req, res, next) {
        try {
            const { productId } = req.body;
            const newNotif = await Notif.create(productId);
            console.log("New Notification", newNotif);
            res.json({
                Message: "New Notification",
                Data: newNotif,
            });
        } catch (error) {
            console.log(error);
        }
    }
}
module.exports = Controller;
