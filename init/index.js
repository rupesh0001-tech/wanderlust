require('dotenv').config(); // always at the top
const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const initData = require("./data.js");
const User = require("../models/user.js");

const MONGO_URL = process.env.ATLAST_URI || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    try {
        if (!MONGO_URL) {
            throw new Error("MongoDB URI is not defined. Check .env file.");
        }

        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB:", MONGO_URL.includes("127.0.0.1") ? "Local" : "Atlas");

        // Initialize database
        await initDB();

        console.log("Data was initialized");
        process.exit(0); // exit after initialization if this is just a script
    } catch (err) {
        console.error("DB connection/init error:", err);
        process.exit(1);
    }
}

const initDB = async () => {
    // Clear old listings in the connected DB
    await Listing.deleteMany({});

    // Find or create admin user
    let adminUser = await User.findOne({ username: "rupesh" });
    if (!adminUser) {
        const sampleUser = new User({
            email: "rupesh@gmail.com",
            username: "rupesh",
        });
        adminUser = await User.register(sampleUser, "rupesh");
    }

    // Assign owner ID to listings
    initData.data = initData.data.map((obj) => ({
        ...obj,
        owner: adminUser._id,
    }));

    await Listing.insertMany(initData.data);
};

main();
