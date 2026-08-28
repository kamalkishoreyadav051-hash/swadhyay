// ===== स्वाध्याय — Frontend SPA =====

const API = "/api";
const FREE_SHIP = 599, SHIP_FEE = 49;

// State
let books = [];
let categories = [];
let currentCat = "All";
let currentQuery = "";
let currentSort = "featured";
let selectedBookId = null;
let view = "home";
let detailQty = 1;
let couponApplied = false;

// ========== HELPERS ==========
function inr(n){ return "₹" + Number(n).toLocaleString("en-IN"); }
function stars(r){
  if(!r) return "";
  const f=Math.floor(r),h=(r%1)>=.5;
  let s="★".repeat(f); if(h)s+="✬"; s+="☆".repeat(5-f-(h?1:0)); return s;
}
function coverHtml(b, cls){
  if(b.cover_url){
    return `<div class="${cls||'book-cover'}"><img src="${b.cover_url}" alt="${b.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div style=display:flex;align-items:center;justify-content:center;height:100%;padding:1rem;text-align:center;color:#fff;font-family:Fredoka;font-weight:600>${b.title}</div>'"></div>`;
  }
  const c = b.isbn ? ["#7b2ff7","#f107a3"] : ["#06d6a0","#0a9396"];
  return `<div class="${cls||'book-cover'}" style="background:linear-gradient(150deg,${c[0]},${c[1]})"><div style="display:flex;align-items:center;justify-content:center;height:100%;padding:1rem;text-align:center;color:#fff;font-family:Fredoka;font-weight:600;font-size:1.1rem">${b.title}</div></div>`;
}

// ========== CART ==========
const CART_KEY = "swadhyay_cart";
function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY))||[]; }catch{ return []; } }
function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }
function cartCount(){ return getCart().reduce((n,i)=>n+i.qty,0); }
function cartSubtotal(){
  return getCart().reduce((n,i)=>{
    const b = books.find(x=>x.id===i.id);
    return b ? n + b.price * i.qty : n;
  },0);
}
function addToCart(id, qty=1){
  const c = getCart();
  const it = c.find(i=>i.id===id);
  if(it) it.qty += qty; else c.push({id, qty});
  saveCart(c);
  updateCartBadge();
  toast("Added to cart ✓");
}
function setQty(id, qty){
  let c = getCart();
  const it = c.find(i=>i.id===id);
  if(!it) return;
  it.qty = Math.max(1, qty);
  if(it.qty <= 0) c = c.filter(i=>i.id!==id);
  saveCart(c);
  updateCartBadge();
}
function removeItem(id){ saveCart(getCart().filter(i=>i.id!==id)); updateCartBadge(); }

function updateCartBadge(){
  document.querySelectorAll(".cart-count").forEach(e=>e.textContent=cartCount());
}

// ========== TOAST ==========
let toastTimer;
function toast(msg){
  let t = document.querySelector(".toast");
  if(!t){ t=document.createElement("div"); t.className="toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove("show"), 2200);
}

// ========== API ==========
async function api(path, opts={}){
  const r = await fetch(API+path, opts);
  return r.json();
}

async function loadBooks(){
  const params = new URLSearchParams();
  if(currentCat && currentCat !== "All") params.set("cat", currentCat);
  if(currentQuery) params.set("q", currentQuery);
  if(currentSort !== "featured") params.set("sort", currentSort);
  books = await api("/books?"+params.toString());
  return books;
}

async function loadCategories(){
  categories = await api("/categories");
  return categories;
}

// ========== ROUTER ==========
function navigate(v, cat){
  view = v;
  if(cat !== undefined) currentCat = cat;
  if(v === "catalog") currentQuery = "";
  if(v !== "book") selectedBookId = null;
  history.pushState({view}, "", "#"+v);
  render();
  window.scrollTo(0,0);
}

function doSearch(q){
  currentQuery = q;
  currentCat = "All";
  navigate("catalog");
}

function openBook(id){
  selectedBookId = id;
  view = "book";
  history.pushState({view:"book"}, "", "#book");
  render();
  window.scrollTo(0,0);
}

// ========== RENDER ==========
function renderNav(){
  const catLinks = categories.map(c =>
    `<a onclick="navigate('catalog','${c}')" class="${view==='catalog'&&currentCat===c?'active':''}">${c}</a>`
  ).join("");
  return `
    <header class="topbar">
      <nav class="nav">
        <div class="brand" onclick="navigate('home')"><span class="logo">स्व</span>स्वाध्याय</div>
        <div class="nav-links">
          <a onclick="navigate('home')" class="${view==='home'?'active':''}">Home</a>
          ${catLinks}
          <a onclick="navigate('admin')" class="${view==='admin'?'active':''}">Admin</a>
        </div>
        <div class="spacer"></div>
        <form class="search" onsubmit="event.preventDefault();doSearch(this.querySelector('input').value)">
          <input type="text" placeholder="Search books...">
        </form>
        <button class="cart-btn" onclick="navigate('cart')">🛒 Cart <span class="cart-count">0</span></button>
      </nav>
    </header>`;
}

function renderFooter(){
  return `
  <footer class="footer">
    <div class="inner">
      <div><div class="brand"><span class="logo">स्व</span>स्वाध्याय</div><p style="max-width:22rem">Your friendly neighbourhood online bookstore. Vibrant stories, delivered to your door.</p></div>
      <div><h4>Shop</h4><a onclick="navigate('catalog')">All books</a><a onclick="navigate('catalog','Fiction')">Fiction</a><a onclick="navigate('catalog','Self-Help')">Self-Help</a><a onclick="navigate('catalog','Finance')">Finance</a></div>
      <div><h4>Company</h4><a>About us</a><a>Careers</a><a>Blog</a><a>Contact</a></div>
      <div><h4>Help</h4><a>Shipping</a><a>Returns</a><a>FAQ</a><a>Track order</a></div>
    </div>
    <div class="bottom">© 2026 स्वाध्याय. Made with ❤ for readers in India.</div>
  </footer>`;
}

function card(b){
  return `
  <div class="card">
    <div class="cover-wrap">
      <div onclick="openBook(${b.id})">${coverHtml(b)}</div>
    </div>
    <div class="card-body">
      <div style="font-weight:600;font-size:.95rem;line-height:1.3;cursor:pointer" onclick="openBook(${b.id})">${b.title}</div>
      <div class="author">${b.author}</div>
      <div class="stars">${stars(b.rating)} <span class="muted" style="font-size:.75rem">(${b.reviews})</span></div>
      <div class="price">${inr(b.price)} ${b.old_price?`<span class="old">${inr(b.old_price)}</span>`:''}</div>
      <button class="add-btn" onclick="addToCart(${b.id})">Add to cart</button>
    </div>
  </div>`;
}

function renderHome(){
  const featured = books.filter(b=>b.featured).slice(0,5);
  const bestsellers = books.filter(b=>b.bestseller).slice(0,5);
  const heroPicks = books.filter(b=>b.featured).slice(0,3);
  const heroArt = heroPicks.map(b => coverHtml(b,"book-cover")).join("");

  return `
  ${renderNav()}
  <section class="hero">
    <div>
      <h1>Find your next <span>adventure</span> between the pages.</h1>
      <p>From midnight libraries to atomic habits — स्वाध्याय brings you handpicked reads at prices that smile. Free shipping over ₹599.</p>
      <div class="flex">
        <button class="btn btn-primary" onclick="navigate('catalog')">Browse books →</button>
      </div>
    </div>
    <div class="hero-art">${heroArt}</div>
  </section>

  <section class="section" id="featured">
    <div class="section-head"><h2>Featured <span>reads</span></h2><span class="see-all" onclick="navigate('catalog')">View all →</span></div>
    <div class="grid">${featured.map(card).join("")}</div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="section-head"><h2>Reader <span>favourites</span></h2><span class="see-all" onclick="navigate('catalog')">View all →</span></div>
    <div class="grid">${bestsellers.map(card).join("")}</div>
  </section>

  <section class="section">
    <div style="background:linear-gradient(110deg,var(--teal),var(--sky));border-radius:24px;padding:2.5rem;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:1.5rem;flex-wrap:wrap;box-shadow:var(--shadow)">
      <div><h2 style="color:#fff;font-size:2rem">Flat 30% off this week</h2><p style="opacity:.95">On all Fiction & Self-Help. Use code <b style="background:rgba(0,0,0,.2);padding:.2rem .6rem;border-radius:8px">READ30</b> at checkout.</p></div>
      <button class="btn" style="background:var(--ink);color:#fff" onclick="navigate('catalog','Fiction')">Shop the sale</button>
    </div>
  </section>

  ${renderFooter()}
  `;
}

function renderCatalog(){
  const pills = categories.map(c =>
    `<button class="pill ${currentCat===c?'active':''}" onclick="navigate('catalog','${c}')">${c}</button>`
  ).join("");

  const title = (currentCat==="All" && !currentQuery)
    ? `All <span>books</span>`
    : currentQuery
      ? `Results for "<span>${currentQuery}</span>"`
      : `${currentCat} <span>books</span>`;

  return `
  ${renderNav()}
  <section class="wrap">
    <div class="section-head" style="margin-bottom:1rem"><h2>${title}</h2><span class="muted">${books.length} book${books.length!==1?"s":""}</span></div>
    <div class="pills">${pills}</div>
    <div class="flex" style="margin-bottom:1.2rem;gap:.8rem">
      <label class="muted" style="font-size:.85rem">Sort by:</label>
      <select id="sort" onchange="currentSort=this.value;render()" style="padding:.4rem .8rem;border-radius:10px;border:2px solid var(--paper-2);font-family:inherit;background:#fff">
        <option value="featured">Featured</option>
        <option value="price-asc" ${currentSort==='price-asc'?'selected':''}>Price: Low to High</option>
        <option value="price-desc" ${currentSort==='price-desc'?'selected':''}>Price: High to Low</option>
        <option value="rating" ${currentSort==='rating'?'selected':''}>Top rated</option>
        <option value="title" ${currentSort==='title'?'selected':''}>Title A–Z</option>
      </select>
    </div>
    ${books.length
      ? `<div class="grid">${books.map(card).join("")}</div>`
      : `<div class="empty"><h3>No books found 🔍</h3><p>Try a different category or search term.</p><span class="see-all" onclick="navigate('catalog','All')">View all books</span></div>`}
  </section>
  ${renderFooter()}
  `;
}

function renderBook(){
  const b = books.find(x=>x.id===selectedBookId);
  if(!b) return `${renderNav()}<section class="wrap"><div class="empty"><h3>Book not found 📭</h3><span class="see-all" onclick="navigate('catalog')">Back to catalog</span></div></section>${renderFooter()}`;
  detailQty = 1;
  const discount = b.old_price ? Math.round((1 - b.price/b.old_price)*100) : 0;
  const related = books.filter(x=>x.category===b.category && x.id!==b.id).slice(0,4);

  return `
  ${renderNav()}
  <section class="wrap">
    <div class="two-col">
      <div>
        <span class="pill active" style="display:inline-block;margin-bottom:1rem">${b.category}</span>
        <div class="detail-cover">${b.cover_url?`<img src="${b.cover_url}" alt="${b.title}" onerror="this.style.display='none'">`:'<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:1rem;text-align:center;color:#fff;font-family:Fredoka;font-weight:600;font-size:1.4rem">'+b.title+'</div>'}</div>
      </div>
      <div>
        <h1 style="font-size:2.4rem">${b.title}</h1>
        <p class="muted" style="font-size:1.05rem">by <b style="color:var(--ink)">${b.author}</b></p>
        <div class="stars" style="color:var(--mustard);font-size:1.1rem;margin:.5rem 0">${stars(b.rating)} <span class="muted" style="font-size:.85rem;color:#8a82a0">${b.rating} · ${b.reviews.toLocaleString("en-IN")} reviews</span></div>
        <div style="margin:1rem 0">
          <span style="font-size:2rem;font-weight:700">${inr(b.price)}</span>
          ${b.old_price?`<span style="color:#b6afc8;text-decoration:line-through;font-size:1.1rem;margin-left:.5rem">${inr(b.old_price)}</span><span style="background:var(--teal);color:#00352a;font-weight:600;padding:.2rem .6rem;border-radius:8px;margin-left:.5rem;font-size:.85rem">${discount}% OFF</span>`:''}
        </div>
        <p style="margin:1rem 0;color:#5a546b">${b.description||''}</p>
        <div class="detail-meta">
          <div><b>Publisher</b>${b.publisher||'—'}</div>
          <div><b>Year</b>${b.year||'—'}</div>
          <div><b>Pages</b>${b.pages||'—'}</div>
          <div><b>Language</b>${b.language||'English'}</div>
          <div><b>ISBN</b>${b.isbn||'—'}</div>
          <div><b>Stock</b>${b.stock>0?`<span style="color:var(--teal);font-weight:600">In stock (${b.stock})</span>`:'<span style="color:var(--coral)">Out of stock</span>'}</div>
        </div>
        <div class="flex" style="margin-top:1.5rem">
          <div class="qty"><button onclick="detailQty=Math.max(1,detailQty-1);document.getElementById('qty').textContent=detailQty">−</button><span id="qty">1</span><button onclick="detailQty++;document.getElementById('qty').textContent=detailQty">+</button></div>
          <button class="btn btn-primary" onclick="addToCart(${b.id},detailQty)">Add to cart</button>
          <button class="btn btn-ghost" onclick="addToCart(${b.id},detailQty);navigate('cart')">Buy now</button>
        </div>
        <p class="muted" style="margin-top:1rem;font-size:.85rem">🚚 Free shipping over ₹599 · Easy 7-day returns</p>
      </div>
    </div>
  </section>
  ${related.length?`
  <section class="section">
    <div class="section-head"><h2>You may also <span>like</span></h2></div>
    <div class="grid">${related.map(r=>`
      <div class="card">
        <div class="cover-wrap"><div onclick="openBook(${r.id})">${coverHtml(r)}</div></div>
        <div class="card-body">
          <div style="font-weight:600;font-size:.95rem">${r.title}</div>
          <div class="author">${r.author}</div>
          <div class="price">${inr(r.price)}</div>
          <button class="add-btn" onclick="addToCart(${r.id})">Add to cart</button>
        </div>
      </div>`).join("")}</div>
  </section>`:''}
  ${renderFooter()}
  `;
}

function renderCart(){
  const cart = getCart();
  if(!cart.length){
    return `${renderNav()}<section class="wrap"><div class="section-head"><h2>Your <span>cart</span></h2></div>
    <div class="empty"><h3>Your cart is empty 🛒</h3><p>Looks like you haven't added any books yet.</p><span class="see-all" onclick="navigate('catalog')">Start browsing →</span></div></section>${renderFooter()}`;
  }

  const subtotal = cartSubtotal();
  const shipping = subtotal >= FREE_SHIP ? 0 : SHIP_FEE;
  const total = subtotal + shipping;

  const rows = cart.map(i=>{
    const b = books.find(x=>x.id===i.id);
    if(!b) return "";
    return `
    <div class="row">
      <div class="mini">${b.cover_url?`<img src="${b.cover_url}" alt="">`:''}</div>
      <div>
        <div style="font-weight:600;cursor:pointer" onclick="openBook(${b.id})">${b.title}</div>
        <div class="author">${b.author} · ${b.category}</div>
        <div class="price" style="margin-top:.2rem">${inr(b.price)}</div>
      </div>
      <div class="qty" style="border-color:var(--paper-2)">
        <button onclick="changeQty(${b.id},${i.qty-1})">−</button><span>${i.qty}</span><button onclick="changeQty(${b.id},${i.qty+1})">+</button>
      </div>
      <div style="font-weight:700">${inr(b.price*i.qty)}</div>
      <button class="del" onclick="changeQty(${b.id},0)" title="Remove">✕</button>
    </div>`;
  }).join("");

  return `
  ${renderNav()}
  <section class="wrap">
    <div class="section-head"><h2>Your <span>cart</span></h2></div>
    <div class="two-col">
      <div>
        <div class="cart-table">${rows}</div>
        <span class="see-all" style="display:inline-block;margin-top:1.2rem;cursor:pointer" onclick="navigate('catalog')">← Continue shopping</span>
      </div>
      <div>
        <div class="summary">
          <h3>Order summary</h3>
          <div class="line"><span>Subtotal</span><span>${inr(subtotal)}</span></div>
          <div class="line"><span>Shipping</span><span>${shipping===0?'<span style="color:var(--teal);font-weight:600">FREE</span>':inr(shipping)}</span></div>
          ${subtotal<FREE_SHIP?`<div class="muted" style="font-size:.8rem;margin-top:-.3rem">Add ${inr(FREE_SHIP-subtotal)} more for free shipping</div>`:''}
          <div class="total"><span>Total</span><span>${inr(total)}</span></div>

          <form onsubmit="placeOrder(event)" style="margin-top:1.5rem">
            <div class="field"><label>Coupon code</label>
              <div class="flex" style="gap:.5rem">
                <input id="coupon" placeholder="READ30" value="${couponApplied?'READ30':''}">
                <button type="button" class="btn btn-ghost" onclick="applyCoupon()">Apply</button>
              </div>
              <div id="coupon-msg" class="muted" style="font-size:.8rem;margin-top:.3rem">${couponApplied?'✓ 30% off applied!':''}</div>
            </div>
            <h3 style="margin-top:1.5rem">Shipping details</h3>
            <div class="field"><label>Full name</label><input id="name" placeholder="Aarav Sharma" required></div>
            <div class="field"><label>Phone</label><input id="phone" type="tel" placeholder="+91 98765 43210" required></div>
            <div class="field"><label>Address</label><input id="addr" placeholder="Flat, Street, City" required></div>
            <div class="flex">
              <div class="field" style="flex:1"><label>City</label><input id="city" placeholder="Mumbai" required></div>
              <div class="field" style="flex:1"><label>Pincode</label><input id="pin" placeholder="400001" required></div>
            </div>
            <div class="field"><label>Payment method</label>
              <select id="pay">
                <option value="COD">COD (Cash on Delivery)</option>
                <option value="Razorpay">Pay Online (Razorpay)</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:1rem;justify-content:center">Place order →</button>
          </form>
        </div>
      </div>
    </div>
  </section>
  ${renderFooter()}
  `;
}

function changeQty(id, qty){
  if(qty<=0) removeItem(id);
  else setQty(id, qty);
  render();
}

function applyCoupon(){
  const code = document.getElementById("coupon").value.trim().toUpperCase();
  const msg = document.getElementById("coupon-msg");
  if(code==="READ30"){ couponApplied=true; msg.style.color="var(--teal)"; msg.textContent="✓ 30% off applied!"; }
  else { couponApplied=false; msg.style.color="var(--coral)"; msg.textContent="Invalid coupon code"; }
}

async function placeOrder(e){
  e.preventDefault();
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const address = document.getElementById("addr").value;
  const city = document.getElementById("city").value;
  const pincode = document.getElementById("pin").value;
  const payMethod = document.getElementById("pay").value;

  const cart = getCart();
  const subtotal = cartSubtotal();
  const shipping = subtotal >= FREE_SHIP ? 0 : SHIP_FEE;
  const total = subtotal + shipping;

  // If Razorpay selected, initiate online payment
  if(payMethod === "Razorpay"){
    const payResp = await api("/create-payment", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ amount: total })
    });

    if(payResp.test_mode){
      // Test mode — no real Razorpay keys configured
      toast("Test payment — no real charge 💳");
      await submitOrder(name, phone, address, city, pincode, "Razorpay", "test_"+Date.now(), cart, subtotal, shipping, total);
      return;
    }

    // Real Razorpay flow — load checkout script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const rzp = new Razorpay({
        key: payResp.key_id,
        amount: total * 100,
        currency: "INR",
        name: "स्वाध्याय",
        description: "Book order",
        order_id: payResp.id,
        handler: async function(resp){
          await submitOrder(name, phone, address, city, pincode, "Razorpay", resp.razorpay_payment_id, cart, subtotal, shipping, total);
        },
        prefill: { name, contact: phone },
        theme: { color: "#7b2ff7" }
      });
      rzp.open();
    };
    document.head.appendChild(script);
    return;
  }

  // COD order
  await submitOrder(name, phone, address, city, pincode, "COD", "", cart, subtotal, shipping, total);
}

async function submitOrder(name, phone, address, city, pincode, payMethod, payId, cart, subtotal, shipping, total){
  const items = cart.map(i=>({id:i.id, title:books.find(b=>b.id===i.id)?.title||"", qty:i.qty, price:books.find(b=>b.id===i.id)?.price||0}));

  const resp = await api("/orders", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      customer_name:name, phone, address, city, pincode,
      payment_method:payMethod, payment_id:payId,
      items, subtotal, shipping, total
    })
  });

  if(resp.success){
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
    toast(`Order placed, ${name.split(" ")[0]}! 🎉`);
    setTimeout(()=>{
      view = "confirm";
      render();
    }, 500);
  }
}

function renderConfirm(){
  return `
  ${renderNav()}
  <section class="wrap">
    <div class="empty">
      <h2 style="color:var(--teal)">Order confirmed! 🎉</h2>
      <p>Thank you for your order. A confirmation has been sent to your phone.</p>
      <p class="muted" style="margin:.5rem 0">${"Razorpay"} payments are processed securely via Razorpay.</p>
      <span class="see-all" onclick="navigate('catalog')">Continue shopping →</span>
    </div>
  </section>
  ${renderFooter()}
  `;
}

// ========== ADMIN ==========
let adminAuthed = false;

function renderAdmin(){
  if(!adminAuthed) return `${renderNav()}<section class="wrap"><div class="form-card" style="max-width:400px;margin:2rem auto">
    <h3>Admin Login</h3>
    <div class="field"><label>Password</label><input type="password" id="admin-pass" placeholder="Enter admin password" onkeydown="if(event.key==='Enter')adminLogin()"></div>
    <button class="btn btn-primary" onclick="adminLogin()" style="width:100%;justify-content:center">Login</button>
    <p class="muted" style="font-size:.8rem;margin-top:.5rem">Default: admin123 (change in .env)</p>
  </div></section>${renderFooter()}`;

  return `
  ${renderNav()}
  <section class="wrap">
    <div class="section-head"><h2>Admin <span>panel</span></h2>
      <button class="btn btn-ghost" onclick="loadOrders()">View Orders</button>
      <button class="btn btn-primary" onclick="showAddForm()">+ Add Book</button>
    </div>

    <div id="admin-content">
      <table class="admin-table">
        <thead><tr><th>Cover</th><th>Title</th><th>Author</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
        <tbody>
          ${books.map(b=>`<tr>
            <td>${b.cover_url?`<img src="${b.cover_url}" alt="">`:'—'}</td>
            <td>${b.title}</td>
            <td>${b.author}</td>
            <td>${b.category}</td>
            <td>${inr(b.price)}</td>
            <td>${b.stock}</td>
            <td>
              <button class="admin-btn edit" onclick="editBook(${b.id})">Edit</button>
              <button class="admin-btn del" onclick="deleteBook(${b.id})">Delete</button>
            </td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </section>
  ${renderFooter()}
  `;
}

function adminLogin(){
  const pw = document.getElementById("admin-pass").value;
  if(pw === (localStorage.getItem("admin_pw") || "admin123")){
    adminAuthed = true;
    render();
  } else {
    toast("Wrong password");
  }
}

function showAddForm(){
  document.getElementById("admin-content").innerHTML = `
  <div class="form-card">
    <h3>Add New Book</h3>
    <form onsubmit="event.preventDefault();saveBook(false)">
      <div class="form-grid">
        <div class="field"><label>Title *</label><input id="f-title" required></div>
        <div class="field"><label>Author *</label><input id="f-author" required></div>
        <div class="field"><label>Category</label><input id="f-category" value="Fiction"></div>
        <div class="field"><label>Price (₹) *</label><input id="f-price" type="number" required></div>
        <div class="field"><label>Old Price (₹)</label><input id="f-old_price" type="number" value="0"></div>
        <div class="field"><label>ISBN</label><input id="f-isbn" placeholder="978..."></div>
        <div class="field"><label>Stock</label><input id="f-stock" type="number" value="10"></div>
        <div class="field"><label>Pages</label><input id="f-pages" type="number" value="200"></div>
        <div class="field"><label>Year</label><input id="f-year" type="number" value="2024"></div>
        <div class="field"><label>Rating</label><input id="f-rating" type="number" step="0.1" value="4.5"></div>
        <div class="field"><label>Publisher</label><input id="f-publisher"></div>
        <div class="field"><label>Reviews</label><input id="f-reviews" type="number" value="0"></div>
        <div class="field full"><label>Description</label><textarea id="f-description" rows="3"></textarea></div>
        <div class="field"><label>Featured</label><select id="f-featured"><option value="1">Yes</option><option value="0">No</option></select></div>
        <div class="field"><label>Bestseller</label><select id="f-bestseller"><option value="1">Yes</option><option value="0">No</option></select></div>
      </div>
      <div class="flex" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary">Save book</button>
        <button type="button" class="btn btn-ghost" onclick="render()">Cancel</button>
      </div>
      <p class="muted" style="font-size:.8rem;margin-top:.5rem">Cover image auto-fetched from Open Library using ISBN. You can also set a cover URL manually below.</p>
      <div class="field" style="margin-top:.5rem"><label>Cover URL (optional)</label><input id="f-cover_url" placeholder="https://..."></div>
    </form>
  </div>`;
}

let editingId = null;
function editBook(id){
  const b = books.find(x=>x.id===id);
  if(!b) return;
  editingId = id;
  document.getElementById("admin-content").innerHTML = `
  <div class="form-card">
    <h3>Edit: ${b.title}</h3>
    <form onsubmit="event.preventDefault();saveBook(true)">
      <div class="form-grid">
        <div class="field"><label>Title *</label><input id="f-title" value="${b.title}" required></div>
        <div class="field"><label>Author *</label><input id="f-author" value="${b.author}" required></div>
        <div class="field"><label>Category</label><input id="f-category" value="${b.category}"></div>
        <div class="field"><label>Price (₹) *</label><input id="f-price" type="number" value="${b.price}" required></div>
        <div class="field"><label>Old Price (₹)</label><input id="f-old_price" type="number" value="${b.old_price}"></div>
        <div class="field"><label>ISBN</label><input id="f-isbn" value="${b.isbn}"></div>
        <div class="field"><label>Stock</label><input id="f-stock" type="number" value="${b.stock}"></div>
        <div class="field"><label>Pages</label><input id="f-pages" type="number" value="${b.pages}"></div>
        <div class="field"><label>Year</label><input id="f-year" type="number" value="${b.year}"></div>
        <div class="field"><label>Rating</label><input id="f-rating" type="number" step="0.1" value="${b.rating}"></div>
        <div class="field"><label>Publisher</label><input id="f-publisher" value="${b.publisher||''}"></div>
        <div class="field"><label>Reviews</label><input id="f-reviews" type="number" value="${b.reviews}"></div>
        <div class="field full"><label>Description</label><textarea id="f-description" rows="3">${b.description||''}</textarea></div>
        <div class="field"><label>Featured</label><select id="f-featured"><option value="1" ${b.featured?'selected':''}>Yes</option><option value="0" ${!b.featured?'selected':''}>No</option></select></div>
        <div class="field"><label>Bestseller</label><select id="f-bestseller"><option value="1" ${b.bestseller?'selected':''}>Yes</option><option value="0" ${!b.bestseller?'selected':''}>No</option></select></div>
        <div class="field full"><label>Cover URL</label><input id="f-cover_url" value="${b.cover_url||''}"></div>
      </div>
      <button type="submit" class="btn btn-primary">Update book</button>
      <button type="button" class="btn btn-ghost" onclick="render()">Cancel</button>
    </form>
  </div>`;
}

async function saveBook(isEdit){
  const password = localStorage.getItem("admin_pw") || "admin123";
  const data = {
    password,
    title: document.getElementById("f-title").value,
    author: document.getElementById("f-author").value,
    category: document.getElementById("f-category").value,
    price: document.getElementById("f-price").value,
    old_price: document.getElementById("f-old_price").value,
    isbn: document.getElementById("f-isbn").value,
    stock: document.getElementById("f-stock").value,
    pages: document.getElementById("f-pages").value,
    year: document.getElementById("f-year").value,
    rating: document.getElementById("f-rating").value,
    publisher: document.getElementById("f-publisher").value,
    reviews: document.getElementById("f-reviews").value,
    description: document.getElementById("f-description").value,
    featured: document.getElementById("f-featured").value === "1",
    bestseller: document.getElementById("f-bestseller").value === "1",
    cover_url: document.getElementById("f-cover_url").value
  };

  if(isEdit){
    await api("/books/"+editingId, {method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)});
    toast("Book updated ✓");
  } else {
    await api("/books", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)});
    toast("Book added ✓");
  }
  editingId = null;
  await loadBooks();
  render();
}

async function deleteBook(id){
  if(!confirm("Delete this book?")) return;
  const password = localStorage.getItem("admin_pw") || "admin123";
  await api("/books/"+id, {method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({password})});
  toast("Book deleted");
  await loadBooks();
  render();
}

async function loadOrders(){
  const password = localStorage.getItem("admin_pw") || "admin123";
  const orders = await api("/orders?password="+password);
  document.getElementById("admin-content").innerHTML = `
    <div class="form-card">
      <h3>Orders (${orders.length})</h3>
      ${orders.length ? `<table class="admin-table">
        <thead><tr><th>Order ID</th><th>Customer</th><th>Phone</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>${orders.map(o=>`<tr>
          <td>${o.order_id}</td>
          <td>${o.customer_name}</td>
          <td>${o.phone}</td>
          <td>${inr(o.total)}</td>
          <td>${o.payment_method}</td>
          <td>${o.status}</td>
          <td>${new Date(o.created_at).toLocaleDateString("en-IN")}</td>
        </tr>`).join("")}</tbody>
      </table>` : '<p class="muted">No orders yet.</p>'}
      <button class="btn btn-ghost" onclick="render()" style="margin-top:1rem">← Back to books</button>
    </div>`;
}

// ========== MAIN RENDER ==========
function render(){
  const app = document.getElementById("app");
  switch(view){
    case "home": app.innerHTML = renderHome(); break;
    case "catalog": app.innerHTML = renderCatalog(); break;
    case "book": app.innerHTML = renderBook(); break;
    case "cart": app.innerHTML = renderCart(); break;
    case "admin": app.innerHTML = renderAdmin(); break;
    case "confirm": app.innerHTML = renderConfirm(); break;
    default: app.innerHTML = renderHome();
  }
  updateCartBadge();
}

// ========== INIT ==========
async function init(){
  app.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:1rem" class="muted">Loading स्वाध्याय…</p></div>';
  await loadCategories();
  await loadBooks();
  const hash = location.hash.replace("#","");
  if(hash) view = hash;
  render();
}

window.addEventListener("popstate", ()=>{ view = location.hash.replace("#","")||"home"; render(); });
init();
