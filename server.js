const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true })); // Add URL encoded support

// Add this line to serve static files (HTML, CSS, JS)
app.use(express.static('.'));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Database connection - Fixed password typo
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "naviharshu", // Fixed: was "navihasrhu"
  database: "sharebite"
});

// Test database connection
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to ShareBite database!");
  }
});

const SECRET = "your_jwt_secret";

// Middleware for JWT authentication
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });
    req.userId = decoded.id;
    next();
  });
}

// Signup
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  const hashed = bcrypt.hashSync(password, 8);
  
  db.query(
    "INSERT INTO users (name, email, password) VALUES (?,?,?)",
    [name, email, hashed],
    (err) => {
      if (err) return res.json({ message: "Error or Email already exists" });
      res.json({ message: "Signup successful" });
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  db.query("SELECT * FROM users WHERE email=?", [email], (err, results) => {
    if (err || results.length === 0)
      return res.json({ message: "User not found" });
    
    const user = results[0];
    if (!bcrypt.compareSync(password, user.password))
      return res.json({ message: "Invalid password" });
    
    const token = jwt.sign({ id: user.id }, SECRET);
    res.json({ token, name: user.name });
  });
});

// Donate food
app.post("/donate", authenticate, (req, res) => {
  const { name, quantity } = req.body;
  
  db.query(
    "INSERT INTO food (name, quantity, user_id) VALUES (?,?,?)",
    [name, quantity, req.userId],
    (err) => {
      if (err) return res.json({ message: "Error donating food" });
      res.json({ message: "Food donated successfully" });
    }
  );
});

// Fetch available food
app.get("/food", (req, res) => {
  db.query("SELECT * FROM food WHERE claimed_by IS NULL", (err, results) => {
    if (err) return res.json({ message: "Error fetching food" });
    res.json(results);
  });
});

// Claim food
app.post("/claim", authenticate, (req, res) => {
  const { food_id } = req.body;
  
  db.query(
    "UPDATE food SET claimed_by=? WHERE id=? AND claimed_by IS NULL",
    [req.userId, food_id],
    (err, result) => {
      if (err || result.affectedRows === 0)
        return res.json({ message: "Food already claimed or error" });
      res.json({ message: "Food claimed successfully" });
    }
  );
});

// Fetch claimed food for current user
app.get("/myclaimed", authenticate, (req, res) => {
  db.query("SELECT * FROM food WHERE claimed_by=?", [req.userId], (err, results) => {
    if (err) return res.json({ message: "Error fetching claimed food" });
    res.json(results);
  });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));