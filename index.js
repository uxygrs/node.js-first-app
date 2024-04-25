// Import necessary modules
import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/backend", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database Connected"))
  .catch((e) => console.log(e));

// Define user schema and model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

// Initialize Express app
const app = express();

// Middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set up view engine
app.set("view engine", "ejs");

// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    try {
      const decoded = jwt.verify(token, "sdjasdbajsdbjasd");
      req.user = await User.findById(decoded._id);
      console.log("User authenticated");
      next();
    } catch (error) {
      console.error("Authentication error:", error.message);
      res.redirect("/login");
    }
  } else {
    console.log("No token found");
    res.redirect("/login");
  }
};

// Routes
app.get("/", isAuthenticated, (req, res) => {
  console.log("Rendering home page");
  res.render("logout", { name: req.user.name });
});

app.get("/login", (req, res) => {
  console.log("Rendering login page");
  res.render("login");
});

app.get("/register", (req, res) => {
  console.log("Rendering register page");
  res.render("register");
});

app.post("/login", async (req, res) => {
  console.log("Login request received");
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  if (!user) {
    console.log("User not found");
    return res.redirect("/register");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.log("Incorrect password");
    return res.render("login", { email, message: "Incorrect Password" });
  }
  const token = jwt.sign({ _id: user._id }, "sdjasdbajsdbjasd");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  console.log("User logged in successfully");
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  console.log("Registration request received");
  const { name, email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    console.log("User already exists");
    return res.redirect("/login");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });
  const token = jwt.sign({ _id: user._id }, "sdjasdbajsdbjasd");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  console.log("User registered and logged in successfully");
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  console.log("Logout request received");
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  console.log("User logged out");
  res.redirect("/");
});

// Start the server
app.listen(4000, () => {
  console.log("Server is working");
});
