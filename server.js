const express = require("express")
const path = require("path")
const db = require("better-sqlite3")("events.db")
const marked = require("marked")



// server
const server = express()

server.use(express.static(path.join(__dirname, "public")))



// database
const createTables = db.transaction(() => {
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    image TEXT,
    body TEXT,
    time_start TEXT,
    time_end TEXT,
    address TEXT,
    icon TEXT,
    icon_priority INTEGER
    )
    `
  ).run()
})

createTables()



// user requests
server.get("/events/:startDate&:endDate", (req, res) => {
  console.log(`GET /events/${req.params.startDate}&${req.params.endDate}`)
  const statement = db.prepare("SELECT * FROM events WHERE date BETWEEN ? AND ?")
  const events = statement.all(req.params.startDate, req.params.endDate)

  res.send({events})
})



// admin requests
server.get("/admin", (req, res) => {
	// adds admin controls on the main page
})

server.get("/dashboard", (req, res) => {
	// returns a page to view all events on
})

server.get("/create-event", (req, res) => {
	// returns a page with a form for creating an event
})

server.get("/edit-event", (req, res) => {
	// returns a page with a form for editing an event
})

server.post("/create-event", (req, res) => {
	// creates an event
})

server.post("/edit-event", (req, res) => {
	// edits an event
})

server.post("/delete-event", (req, res) => {
	// deletes an event
})

server.get("/get-icons", (req, res) => {
	// returns all the icons in the server
})

server.post("/upload-icon", (req, res) => {
	// uploads an icon to the server
})

server.post("/delete-icon", (req, res) => {
	// deletes an icon from the server
})



server.listen(3000)