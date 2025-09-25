// app.js
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const Listing = require("./models/listing");
const User = require("./models/user");
const initData = require("./init/data.js");
const listingsRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const ExpressError = require("./utils/ExpressError.js");

const app = express();

// --------------------- DB Connection ---------------------
const MONGO_URL = process.env.ATLAST_URI || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");

        // Initialize DB data (optional)
        await initDB();

        // Start server AFTER DB connection
        app.listen(process.env.PORT || 8080, () => {
            console.log(`App is listening on port ${process.env.PORT || 8080}`);
        });
    } catch (err) {
        console.error("DB connection/init error:", err);
        process.exit(1);
    }
}

// Initialize default listings & admin user
async function initDB() {
    // Optional: clear old listings in cloud DB
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

    // Insert initial listings
    initData.data = initData.data.map(obj => ({
        ...obj,
        owner: adminUser._id
    }));
    await Listing.insertMany(initData.data);
    console.log("DB data initialized");
}

// --------------------- Middlewares ---------------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// Session store
const store = MongoStore.create({
    mongoUrl: MONGO_URL,
    crypto: { secret: process.env.SECRET },
    touchAfter: 24 * 3600,
});
store.on("error", () => console.log("MONGO SESSION STORE ERROR"));

app.use(session({
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { expires: Date.now() + 7*24*60*60*1000, maxAge: 7*24*60*60*1000, httpOnly: true }
}));

app.use(flash());

// Passport config
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash & current user middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;
    next();
});

// Routes
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// 404 & error handler
app.all("*", (req, res, next) => next(new ExpressError(404, "Page not found")));
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("listings/error.ejs", { message });
});

// Start everything
main();
