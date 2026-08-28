// ===== Seed script — populates the database with real books =====
// Book covers come from Open Library's free cover API by ISBN
const db = require("./db");

const SEED_BOOKS = [
  {title:"The Midnight Library",author:"Matt Haig",category:"Fiction",price:399,old_price:550,rating:4.5,reviews:1240,pages:304,year:2020,isbn:"9781786892720",publisher:"Canongate",stock:12,featured:1,bestseller:1,desc:"Between life and death there is a library. Each book is a chance to try another life and see how things might have been."},
  {title:"Atomic Habits",author:"James Clear",category:"Self-Help",price:449,old_price:699,rating:4.8,reviews:5600,pages:320,year:2018,isbn:"9781847941831",publisher:"Random House",stock:25,featured:1,bestseller:1,desc:"Tiny changes, remarkable results. A proven framework for improving every day with the power of compounding habits."},
  {title:"Sapiens",author:"Yuval Noah Harari",category:"History",price:599,old_price:799,rating:4.7,reviews:3200,pages:464,year:2014,isbn:"9780062316097",publisher:"Harper",stock:8,featured:1,bestseller:0,desc:"A bold exploration of how Homo sapiens came to dominate the earth."},
  {title:"The Alchemist",author:"Paulo Coelho",category:"Fiction",price:299,old_price:399,rating:4.6,reviews:8900,pages:208,year:1988,isbn:"9780061122415",publisher:"HarperOne",stock:40,featured:1,bestseller:1,desc:"A shepherd boy named Santiago travels from Spain to the Egyptian desert in search of treasure."},
  {title:"Wings of Fire",author:"A.P.J. Abdul Kalam",category:"Biography",price:349,old_price:499,rating:4.9,reviews:6700,pages:180,year:1999,isbn:"9788173711466",publisher:"Universities Press",stock:18,featured:1,bestseller:1,desc:"The inspiring autobiography of India's missile man and former President."},
  {title:"Rich Dad Poor Dad",author:"Robert Kiyosaki",category:"Finance",price:399,old_price:550,rating:4.4,reviews:4100,pages:336,year:1997,isbn:"9781612680194",publisher:"Plata Publishing",stock:15,featured:0,bestseller:1,desc:"What the rich teach their kids about money that the poor and middle class do not."},
  {title:"Ikigai",author:"Héctor García",category:"Self-Help",price:375,old_price:499,rating:4.5,reviews:2800,pages:208,year:2017,isbn:"9780143170776",publisher:"Penguin",stock:22,featured:1,bestseller:0,desc:"The Japanese secret to a long and happy life."},
  {title:"1984",author:"George Orwell",category:"Fiction",price:279,old_price:399,rating:4.7,reviews:12000,pages:328,year:1949,isbn:"9780451524935",publisher:"Signet Classic",stock:30,featured:0,bestseller:1,desc:"A dystopian masterpiece where Big Brother watches everything."},
  {title:"The Psychology of Money",author:"Morgan Housel",category:"Finance",price:399,old_price:550,rating:4.7,reviews:3600,pages:256,year:2020,isbn:"9789390166263",publisher:"Jaico",stock:20,featured:1,bestseller:1,desc:"Timeless lessons on wealth, greed and happiness."},
  {title:"A Brief History of Time",author:"Stephen Hawking",category:"Science",price:499,old_price:650,rating:4.6,reviews:2900,pages:256,year:1988,isbn:"9780553380163",publisher:"Bantam",stock:10,featured:0,bestseller:0,desc:"From the Big Bang to black holes — one of the most accessible introductions to cosmology."},
  {title:"Pride and Prejudice",author:"Jane Austen",category:"Fiction",price:249,old_price:350,rating:4.8,reviews:7800,pages:432,year:1813,isbn:"9780141439518",publisher:"Penguin Classics",stock:28,featured:0,bestseller:0,desc:"Elizabeth Bennet and the proud Mr Darcy navigate love and class in Regency England."},
  {title:"A Man Called Ove",author:"Fredrik Backman",category:"Fiction",price:379,old_price:499,rating:4.7,reviews:5400,pages:337,year:2012,isbn:"9781476738024",publisher:"Atria Books",stock:14,featured:1,bestseller:0,desc:"A grumpy old man has his life turned upside down by a chatty young family next door."}
];

// Open Library cover URL by ISBN — free, no API key needed
function coverUrl(isbn){
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

const insert = db.prepare``
  INSERT OR REPLACE INTO books
  (title, author, category, price, old_price, rating, reviews, pages, language, year, isbn, publisher, stock, cover_url, description, featured, bestseller)
  VALUES (@title, @author, @category, @price, @old_price, @rating, @reviews, @pages, 'English', @year, @isbn, @publisher, @stock, @cover_url, @desc, @featured, @bestseller)
`);

const tx = db.transaction((books) => {
  // Clear existing books first (only if re-seeding)
  db.prepare("DELETE FROM books").run();

  for (const b of books) {
    insert.run({ ...b, cover_url: coverUrl(b.isbn) });
  }
});

tx(SEED_BOOKS);
console.log(`✓ Seeded ${SEED_BOOKS.length} books with real cover images`);
