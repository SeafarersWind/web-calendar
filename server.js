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



// requests
server.get("/abc", (req, res) => {
  console.log("abc!")

  res.send("Thank you for abc.")
})

server.get("/events/:startDate&:endDate", (req, res) => {
  console.log(`GET /events/${req.params.startDate}&${req.params.endDate}`)
  const statement = db.prepare("SELECT * FROM events WHERE date BETWEEN ? AND ?")
  const events = statement.all(req.params.startDate, req.params.endDate)

  res.send({events})
})



server.listen(3000)