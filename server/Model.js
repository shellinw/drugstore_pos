const moongoes = require("mongoose");
const Product = moongoes.model("Product", {
    id: {
        type: Number,
        require: true,
    },
    name: {
        type: String,
        require: true,
        trim: true,
    },
    manufacturer: {
        type: String,
        require: true,
    },
    dosage: {
        type: String,
        require: true,
    },
    unit: {
        type: {
            type: String,
            enum: ["Bottle", "Tube", "Strip", "Box"],
            required: true,
        },
        details: {
            numberOfStrips: {
                type: Number,
                validate: {
                    validator: function (v) {
                        // Validate that numberOfStrips is provided only for Box unit type
                        return this.unit.type === "Box"
                            ? typeof v === "number"
                            : true;
                    },
                    message:
                        "numberOfStrips is only applicable for the Box unit type",
                },
            },
            numberOfTabs: {
                type: Number,
                validate: {
                    validator: function (v) {
                        // Validate that numberOfStrips is provided only for Box unit type
                        return this.unit.type === "Box"
                            ? typeof v === "number"
                            : true;
                    },
                    message:
                        "numberofTablet is only applicable for the Box-Strip",
                },
            },
            size: {
                type: String,
                validate: {
                    validator: function (v) {
                        // Validate that numberOfStrips is provided only for Box unit type
                        return this.unit.type !== "Box"
                            ? typeof v === "string"
                            : true;
                    },
                    message:
                        "numberofTablet is only applicable for the Box-Strip",
                },
            },
        },
    },
    status: {
        type: String,
        default: "Activate",
    },
    description: {
        type: String,
        default: false,
    },
    inventory: [
        {
            type: moongoes.Schema.Types.ObjectId,
            ref: "Inventory",
        },
    ],
});

const Inventory_Batch = moongoes.model("Inventory", {
    id: {
        type: String,
        require: true,
    },
    productId: {
        type: moongoes.Schema.Types.ObjectId, // Reference to the Product model
        ref: "Product", // Name of the referenced model
        required: true,
    },
    quantity: {
        type: Number,
        require: true,
    },
    discRate: {
        type: Number,
        require: false,
    },
    expired_date: {
        type: Date,
        require: true,
    },
    intake_date: {
        type: Date,
        require: true,
    },
    batchNumber: {
        type: String,
        require: true,
    },
    price: {
        type: Number,
        require: true,
    },
    batchStatus: {
        type: String,
        default: "Available",
        enum: ["Available", "Unavailable"],
    },
});

const User = moongoes.model("user", {
    id: {
        type: Number,
        require: true,
    },
    username: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        require: false,
    },
    email: {
        type: String,
        require: false,
    },
    role: {
        type: String,
        default: "admin",
        enum: ["admin", "superadmin"],
    },
});

const OrderDetail = moongoes.model("OrderDetail", {
    id: {
        type: Number,
        require: true,
    },
    productId: {
        type: moongoes.Schema.Types.ObjectId, // Reference to the Product model
        ref: "Product", // Name of the referenced model
        required: true,
    },
    quantity: {
        type: Number,
        require: true,
    },
    subtotal: {
        type: Number,
        default: 0,
    },
    batchId: {
        type: moongoes.Schema.Types.ObjectId, // Reference to the Product model
        ref: "Inventory", // Name of the referenced model
        required: true,
    },
});
const Order = moongoes.model("OrderSchema", {
    id: {
        type: Number,
        require: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    customer: {
        type: moongoes.Schema.Types.ObjectId,
        ref: "Customer",
        require: false,
    },
    customerName: {
        type: String,
        required: false,
    },
    phoneNumber: {
        type: String,
        require: false,
    },
    orderType: {
        type: String,
        default: "walk in",
    },
    orderDetails: [
        {
            type: moongoes.Schema.Types.ObjectId,
            ref: "OrderDetail",
        },
    ],
    paymentDetail: {
        type: moongoes.Schema.Types.ObjectId,
        ref: "PaymentReceiptSchema",
        require: false,
    },
    totalPrice: {
        type: Number,
        default: 0,
    },
    paymentVia: {
        type: String,
        default: "Cash",
    },
    orderStatus: {
        type: String,
        default: "Open",
        enum: ["Open", "Closed", "Cancelled", "Proccesing", "Hold", "Done"],
    },
    salesPerson: {
        type: String,
        require: true,
    },
});

const Customer = moongoes.model("Customer", {
    id: {
        type: Number,
        require: true,
    },
    fullName: {
        type: String,
        require: true,
    },
    dob: {
        type: Date,
        require: false,
    },
    phoneNumber: {
        type: String,
        require: false,
    },
    address: {
        type: String,
        require: false,
        default: "-",
    },
    points: {
        type: Number,
        default: 0,
    },
    orderRecord: [
        {
            type: moongoes.Schema.Types.ObjectId,
            ref: "OrderSchema",
        },
    ],
});

const PaymentReceipts = moongoes.model("PaymentReceiptSchema", {
    id: {
        type: Number,
        require: true,
    },
    orderId: {
        type: moongoes.Schema.Types.ObjectId,
        ref: "OrderSchema",
    },
    paymentMethod: {
        type: String,
        require: true,
    },
    paymentMerchant: {
        type: String,
        require: false,
    },
    paymentDate: {
        type: Date,
        default: Date.now(),
    },
    paymentAmount: {
        type: Number,
        require: true,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
    },
    paymentProof: {
        type: String,
        require: true,
    },
    customerId: {
        type: moongoes.Schema.Types.ObjectId,
        ref: "Customer",
    },
});

const Notif = moongoes.model("notifs", {
    id: {
        type: Number,
        require: true,
    },
    productId: {
        type: moongoes.Schema.Types.ObjectId, // Reference to the Product model
        ref: "Product", // Name of the referenced model
        required: true,
    },
    notificationStatus: {
        type: String,
        default: "Unread",
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});
module.exports = {
    Product,
    User,
    OrderDetail,
    Order,
    Inventory_Batch,
    Customer,
    PaymentReceipts,
    Notif,
};
