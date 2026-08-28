// ===== स्वाध्याय — Express server =====
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Razorpay keys (test mode by default)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const FREE_SHIP = 599, SHIP_FEE = 49;

// ===== API ROUTES =====

// GET /api/books — list all books (with optional category filter & search)
app.get("/api/books", (req, res) => {
  const { cat, q, sort } = req.query;
  let query = "SELECT * FROM books";
  const conditions = [];
  const params = {};

  if (cat && cat !== "All") {
    conditions.push("category = @cat");
    params.cat = cat;
  }
  if (q) {
    conditions.push("(title LIKE @q OR author LIKE @q OR category LIKE @q)");
    params.q = `%${q}%`;
  }

  if (conditions.length) query += " WHERE " + conditions.join(" AND ");

  if (sort === "price-asc") query += " ORDER BY price ASC";
  else if (sort === "price-desc") query += " ORDER BY price DESC";
  else if (sort === "rating") query += " ORDER BY rating DESC";
  else if (sort === "title") query += " ORDER BY title ASC";
  else query += " ORDER BY featured DESC, bestseller DESC";
  // Keep the data fresh each request — avoid stale caching

  const books = db.prepare(query).all(params);
  res.json(books);
});

// GET /api/books/:id — single book detail
app.get("/api/books/:id", (req, res) => {
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

// GET /api/categories
app.get("/api/categories", (req, res) => {
  const cats = db.prepare("SELECT DISTINCT category FROM books ORDER BY category").all();
  res.json(["All", ...cats.map(c => c.category)]);
});

// POST /api/books — admin: add a new book
app.post("/api/books", (req, res) => {
  const { password, ...b } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

  const cover_url = b.cover_url || (b.isbn ? `https://covers.openlibrary.org/b/isbn/${b.isbn}-L.jpg` : "");
  const result = db.prepare(`
    INSERT INTO books (title, author, category, price, old_price, rating, reviews, pages, language, year, isbn, publisher, stock, cover_url, description, featured, bestseller)
    VALUES (@title, @author, @category, @price, @old_price, @rating, @reviews, @pages, @language, @year, @isbn, @publisher, @stock, @cover_url, @description, @featured, @bestseller)
  `).run({
    title: b.title || "Untitled", author: b.author || "Unknown", category: b.category || "Fiction",
    price: Number(b.price) || 0, old_price: Number(b.old_price) || 0, rating: Number(b.rating) || 4.0,
    reviews: Number(b.reviews) || 0, pages: Number(b.pages) || 0, language: b.language || "English",
    year: Number(b.year) || 2024, isbn: b.isbn || "", publisher: b.publisher || "",
    stock: Number(b.stock) || 0, cover_url, description: b.description || "",
    featured: b.featured ? 1 : 0, bestseller: b.bestseller ? 1 : 0
  });
  res.json({ success: true, id: result.lastInsertRowid });
});

// PUT /api/books/:id — admin: edit a book
app.put("/api/books/:id", (req, res) => {
  const { password, ...b } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

  const cover_url = b.cover_url || (b.isbn ? `https://covers.openlibrary.org/b/isbn/${b.isbn}-L.jpg` : "");
  db.prepare(`
    UPDATE books SET title=@title, author=@author, category=@category, price=@price, old_price=@old_price,
    rating=@rating, reviews=@reviews, pages=@pages, language=@language, year=@year, isbn=@isbn,
    publisher=@publisher, stock=@stock, cover_url=@cover_url, description=@description, featured=@featured, bestseller=@bestseller
    WHERE id=@id
  `).run({
    id: Number(req.params.id),
    title: b.title, author: b.author, category: b.category,
    price: Number(b.price), old_price: Number(b.old_price), rating: Number(b.rating),
    reviews: Number(b.reviews), pages: Number(b.pages), language: b.language || "English",
    year: Number(b.year), isbn: b.isbn || "", publisher: b.publisher || "",
    stock: Number(b.stock), cover_url, description: b.description || "",
    featured: b.featured ? 1 : 0, bestseller: b.bestseller ? 1 : 0
  });
  res.json({ success: true });
});

// DELETE /api/books/:id — admin: delete a book
app.delete("/api/books/:id", (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

  db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// POST /api/orders — create a new order
app.post("/api/orders", (req, res) => {
  const { customer_name, phone, address, city, pincode, payment_method, items, subtotal, shipping, total } = req.body;

  if (!customer_name || !phone || !address) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const order_id = "ORD" + Date.now() + Math.floor(Math.random() * 1000);

  db.prepare(`
    INSERT INTO orders (order_id, customer_name, phone, address, city, pincode, payment_method, payment_id, items, subtotal, shipping, total, status)
    VALUES (@order_id, @customer_name, @phone, @address, @city, @pincode, @payment_method, @payment_id, @items, @subtotal, @shipping, @total, 'confirmed')
  `).run({
    order_id, customer_name, phone, address, city, pincode,
    payment_method: payment_method || "COD",
    payment_id: "",
    items: JSON.stringify(items),
    subtotal: Number(subtotal), shipping: Number(shipping), total: Number(total)
  });

  res.json({ success: true, order_id });
});

// GET /api/orders — admin: list all orders
app.get("/api/orders", (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

  const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  res.json(orders);
});

// ===== Razorpay payment integration =====
// POST /api/create-order — creates a Razorpay order for online payment
app.post("/api/create-payment", async (req, res) => {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    // Fallback: if no Razorpay keys configured, simulate a test payment
    return res.json({
      test_mode: true,
      order_id: "test_" + Date.now(),
      amount: Number(req.body.amount),
      currency: "INR",
      key_id: "rzp_test_placeholder"
    });
  }

  try {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    const amount = Number(req.body.amount) * 100; // Razorpay uses paise

    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: "swadhyay_" + Date.now()
      })
    });

    const data = await resp.json();
    res.json({ ...data, key_id: RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ error: "Payment init failed", details: err.message });
  }
});

// SPA fallback — serve index.html for all non-API routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n📚 स्वाध्याय bookstore running on http://localhost:${PORT}`);
  console.log(`   Admin password: ${ADMIN_PASSWORD}`);
  console.log(`   Razorpay: ${RAZORPAY_KEY_ID ? "configured" : "not configured (test mode)"}\n`);
});
