const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = "rafid_ahmmad_jwt"; // Replace with your own secret

// Connect to MongoDB
mongoose
   .connect("mongodb+srv://rafid:rafidispro@cluster0.adpgu.mongodb.net/ecommerce", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
   })
   .then(() => console.log("MongoDB connected"))
   .catch((err) => {
      console.error(err.message);
      process.exit(1);
   });

// Use CORS middleware
app.use(cors());
// Middleware
app.use(bodyParser.json());

// User Model
const UserSchema = new mongoose.Schema({
   firstName: { type: String, required: false },
   lastName: { type: String, required: false },
   email: { type: String, required: true, unique: true },
   password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

app.get("/", (req, res) => {
   res.send("Hello World");
});

// Routes
app.post("/api/auth/signup", async (req, res) => {
   const { firstName, lastName, email, password } = req.body;

   try {
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
         return res.status(400).json({ msg: "User already exists" });
      }

      // Create new user
      user = new User({
         firstName,
         lastName,
         email,
         password,
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Generate JWT
      const payload = {
         user: {
            id: user.id,
         },
      };

      jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
         if (err) throw err;
         res.json({ token });
      });
   } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
   }
});

// Login route
app.post("/api/auth/login", async (req, res) => {
   const { email, password } = req.body;

   try {
      console.log(email, password);
      // Check if user exists
      let user = await User.findOne({ email });
      if (!user) {
         return res.status(400).json({ msg: "Invalid credentials" });
      }

      // console.log("testing", password, user.password);
      // Validate password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         return res.status(400).json({ msg: "Invalid credentials" });
      }

      // Generate JWT
      const payload = {
         user: {
            id: user.id,
         },
      };

      jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
         if (err) throw err;
         res.json({ token, success: true });
      });
   } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
   }
});

// Start server
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});
