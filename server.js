const express = require("express")
const path = require("path")
const fs = require("fs")
const db = require("better-sqlite3")("events.db")
const multer = require("multer")
const marked = require("marked")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

const JWT_SECRET = "your-very-secure-secret-key-change-this" // In production, use environment variables

// server
const server = express()

server.use(express.json())
server.use(express.urlencoded({ extended: true }))

// database
const createTables = db.transaction(() => {
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date INTEGER NOT NULL,
    title TEXT NOT NULL,
    image TEXT,
    body TEXT NOT NULL,
    time_start TEXT,
    time_end TEXT,
    address TEXT,
    icon TEXT,
    icon_priority INTEGER
    )
    `
  ).run()

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
    )
    `
  ).run()
})

createTables()

// multer
const upload = multer({
  dest: path.join(__dirname, "images"),
  limits: {
    fileSize: 100 * 1000000 // 100 MB
  }
})

// auth middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader.split(' ')[1]
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403)
      }
      req.user = user
      next()
    })
  } else {
    res.sendStatus(401)
  }
}

// ---------------------------------------------------------
// ADMINISTRATIVE API ROUTES (Must be before static middleware)
// ---------------------------------------------------------

server.post("/admin/signup", async (req, res) => {
  const { username, password } = req.body
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    db.prepare("INSERT INTO admins (username, password) VALUES (?, ?)").run(username, hashedPassword)
    res.status(201).send({ message: "Admin created successfully" })
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).send({ error: "Username already exists" })
    } else {
      res.status(500).send({ error: "Signup failed" })
    }
  }
})

server.post("/admin/login", async (req, res) => {
  const { username, password } = req.body
  const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username)
  
  if (admin && await bcrypt.compare(password, admin.password)) {
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '1h' })
    res.json({ token })
  } else {
    res.status(401).send({ error: "Invalid username or password" })
  }
})

server.post("/admin/create-event", authenticateJWT, upload.single("image"), (req, res) => {
  console.log("POST create-event")
  const form = req.body
  try {
    const info = db.prepare(`
      INSERT INTO events
      (date, title, body, image, time_start, time_end, address, icon, icon_priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      form.date,
      form.title,
      form.body,
      null,
      form.time_start || null,
      form.time_end || null,
      form.address || null,
      form.icon || null,
      form.icon_priority || null
    )

    const eventId = info.lastInsertRowid
    let imageName = null

    if (req.file) {
      imageName = `${eventId}${path.extname(req.file.originalname).toLowerCase()}`
      fs.rename(req.file.path, path.join(__dirname, "public/images/", imageName), err => {
        if (err) console.error("Error renaming image:", err)
      });
      db.prepare(`UPDATE events SET image = ? WHERE id = ?`).run(imageName, eventId)
    }

    res.status(200).send({ message: "Event created successfully", id: eventId })
  } catch (err) {
    console.error("Database error during event creation:", err)
    res.status(500).send({ error: "Failed to create event" })
  }
})

server.post("/admin/edit-event", authenticateJWT, upload.single("image"), (req, res) => {
  const form = req.body
  console.log("POST edit-event", form)
  try {
    const eventId = form.id
    if (!eventId) return res.status(400).send({ error: "Missing event ID" })

    let imageName = form.current_image || null
    if (req.file) {
      imageName = `${eventId}${path.extname(req.file.originalname).toLowerCase()}`
      fs.rename(req.file.path, path.join(__dirname, "public/images/", imageName), err => {
        if (err) console.error("Error moving file:", err)
      })
    }

    db.prepare(`
      UPDATE events
      SET date = ?, title = ?, body = ?, image = ?, time_start = ?, time_end = ?, address = ?, icon = ?, icon_priority = ?
      WHERE id = ?
    `).run(
      form.date,
      form.title,
      form.body,
      imageName,
      form.time_start || null,
      form.time_end || null,
      form.address || null,
      form.icon || null,
      form.icon_priority || null,
      eventId
    )
    res.status(200).send({ message: "Event updated successfully" })
  } catch (err) {
    console.error("Database error during event update:", err)
    res.status(500).send({ error: "Failed to update event" })
  }
})

server.post("/admin/delete/:id", authenticateJWT, (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).send({ error: "Invalid ID format" })
  console.log("POST delete", id)
  try {
    const result = db.prepare(`DELETE FROM events WHERE id = ?`).run(id)
    if (result.changes === 0) return res.status(404).send({ error: "Event not found" })
    res.status(200).send({ message: "Event deleted successfully" })
  } catch (err) {
    console.error("Database error during event deletion:", err)
    res.status(500).send({ error: "Failed to delete event" })
  }
})

server.get("/isadmin", authenticateJWT, (req, res) => {
  res.send({ isadmin: true }) 
})

server.get("/admin/dashboard/events", authenticateJWT, (req, res) => {
  const events = db.prepare("SELECT * FROM events ORDER BY date DESC, id DESC").all()
  res.send({events})
})

// ---------------------------------------------------------

server.use(express.static(path.join(__dirname, "public"), {
  extensions: ['html', 'htm']
}))

server.use("/admin", express.static(__dirname + "/admin", {
  extensions: ['html', 'htm']
}))

server.get("/events/:startDate&:endDate", (req, res) => {
  const events = db.prepare("SELECT * FROM events WHERE date BETWEEN ? AND ?")
    .all(req.params.startDate, req.params.endDate)
  res.send({events})
})

server.get("/event/:id", (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id)
  res.send(event)
})

server.listen(3000)