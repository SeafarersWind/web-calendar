const express = require("express")
const path = require("path")
const fs = require("fs")
const db = require("better-sqlite3")("events.db")
const multer = require("multer")
const marked = require("marked")



// server
const server = express()

server.use(express.static(path.join(__dirname, "public"), {
  extensions: ['html', 'htm']
}))

server.use("/admin", express.static(__dirname + "/admin", {
  extensions: ['html', 'htm']
}))



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
})

createTables()



// multer
const upload = multer({
  dest: path.join(__dirname, "images"),
  limits: {
    fileSize: 100 * 1000000 // 100 MB
  }
})



// middleware
server.use((req, res, next) => {
  if (req.path.slice(-1) === '/' && req.path.length > 1) {
    const query = req.url.slice(req.path.length)
    const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
    res.redirect(301, safepath + query)
  } else {
    next()
  }
})



// errors
const handleError = (err, res) => {
  res.status(500)
    .contentType("text/plain")
    .end("Oops! Something went wrong!");
}



// user requests
server.get("/events/:startDate&:endDate", (req, res) => {
  // console.log(`GET /events/${req.params.startDate}&${req.params.endDate}`)
  const events = db.prepare("SELECT * FROM events WHERE date BETWEEN ? AND ?")
    .all(req.params.startDate, req.params.endDate)

  res.send({events})
})

server.get("/event/:id", (req, res) => {
  // console.log(`GET /event/${req.params.id}`)
  const event = db.prepare("SELECT * FROM events WHERE id = ?")
    .get(req.params.id)

  res.send(event)
})



// admin requests
server.get("/isadmin", (req, res) => {
  // adds admin controls on the main page
  console.log("admin")
  res.send(true)
})

server.get("/admin/dashboard/events", (req, res) => {
  const events = db.prepare("SELECT * FROM events ORDER BY date DESC, id DESC")
    .all()

  res.send({events})
})

server.post("/admin/create-event", upload.single("image"), (req, res) => {
  // creates an event
  console.log("POST create-event")

  const form = req.body

  const eventId = db.prepare(`SELECT seq FROM SQLITE_SEQUENCE WHERE name = 'events'`).get().seq + 1
  const imageName = req.file ? `${eventId}${path.extname(req.file.originalname).toLowerCase()}` : null

console.log(form)

  db.prepare(`
    INSERT INTO events
    (date, title, body, image, time_start, time_end, address, icon, icon_priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    form.date,
    form.title,
    form.body,
    imageName,
    form.time_start ? form.time_start : null,
    form.time_end ? form.time_end : null,
    form.address ? form.address : null,
    form.icon ? form.icon : null,
    form.icon_priority ? form.icon_priority : null
  )

  if(req.file) {
    fs.rename(req.file.path, path.join(__dirname, "public/images/", imageName), err => {
      if (err) return handleError(err, res)
    });
  }

  res.status(200)
})

server.post("/edit-event", (req, res) => {
  // edits an event
})

server.post("/admin/delete/:id", (req, res) => {
  db.prepare(`DELETE FROM events WHERE id = ?`)
  .run(req.params.id)

  res.redirect("/admin/dashboard")
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