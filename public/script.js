
const calendarDates = document.querySelector('.calendar-dates')
const monthYear = document.getElementById('month-year')
const prevMonthBtn = document.getElementById('prev-month')
const nextMonthBtn = document.getElementById('next-month')

const eventContainer = document.getElementById('event-container')
const eventTitle = document.getElementById('event-title')
const eventImage = document.getElementById('event-image')
const eventInfo = document.getElementById('event-info')

const eventListContainer = document.getElementById('event-list-container')
const eventList = document.getElementById('event-list')

const eventFullList = document.getElementById('event-full-list')

const closeButton = document.getElementById('close-button')

let currentDate = new Date()
let currentMonth = currentDate.getMonth()
let currentYear = currentDate.getFullYear()
let currentEvent = -1

let firstDate
let lastDate

let earliestLoadedDate = 65535
let latestLoadedDate = 0

let dates = {}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

let clickDate






function renderCalendar(month, year) {
  eventFullList.replaceChildren()

  calendarDates.innerHTML = ''
  monthYear.textContent = `${months[month]} ${year}`

  // get current day in PST
  const todayLocal = new Date((new Date()).toLocaleString('en-US', { timeZone: 'America/Vancouver' }))
  const today = new Date(Date.UTC(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate()))
  const todayValue = today.getTime() / (1000*3600*24)

  const monthStart = new Date(Date.UTC(year, month, 1))
  const monthEnd = new Date(Date.UTC(year, month+1, 0))

  const monthStartValue = monthStart.getTime() / (1000*3600*24)
  const monthEndValue = monthEnd.getTime() / (1000*3600*24)

  const firstWeekday = monthStart.getUTCDay() // Sun == 0
  const lastWeekday = monthEnd.getUTCDay()    // Sat == 6

  firstDate = new Date(Date.UTC(year, month, 1 - firstWeekday)).getTime() / (1000*3600*24)
  lastDate = new Date(Date.UTC(year, month+1, 6 - lastWeekday)).getTime() / (1000*3600*24)

  let entryDateNum = new Date(firstDate * (1000*3600*24)).getUTCDate()

  for(var dateValue = firstDate; dateValue <= lastDate; dateValue++) {
    const entry = document.createElement('div')

    entry.classList.add('date')

    if(dateValue < monthStartValue) {
      entry.classList.add('prev-month')
    } else if(dateValue > monthEndValue) {
      entry.classList.add('next-month')
    }

    if(dateValue == todayValue) {
      entry.classList.add('current-date')
    }

    let entryText = document.createElement('div')
    entryText.classList.add('date-num')
    entryText.textContent = entryDateNum
    entry.appendChild(entryText)

    calendarDates.appendChild(entry)
    renderEvent(dateValue)

    if(dateValue == monthStartValue-1 || dateValue == monthEndValue) {
      entryDateNum = 1
    } else {
      entryDateNum++
    }
  }
}

function renderEvent(date) {
  if(date < firstDate || date > lastDate) {
    return
  }

  const events = dates[date]

  if(events && events.length) {
    const entry = calendarDates.childNodes[date - firstDate]
    entry.classList.add('event')

    let dateIcons = entry.querySelector('.icons')
    if(!dateIcons) {
      dateIcons = document.createElement('div')
      dateIcons.classList.add('icons')
      entry.appendChild(dateIcons)
    } else {
      dateIcons.replaceChildren()
    }

    let iconPriority = 0
    for(let i = 0; i < events.length; i++) {
      if(events[i].icon && events[i].icon_priority >= iconPriority) {
        if(events[i].icon_priority > iconPriority) {
          dateIcons.replaceChildren()
          iconPriority = events[i].icon_priority
        }
        let icon = document.createElement('img')
        icon.src = `/icons/${events[i].icon}.png`
        icon.classList.add('icon')
        dateIcons.appendChild(icon)
      }
    }
  }
}

function renderEventList() {
  eventFullList.replaceChildren()

  for(var d = firstDate; d <= lastDate; d++) {
    const events = dates[d]
    if(events && events.length) {
      let listDate = document.createElement('div')
      listDate.textContent = dateTitle(d)
      eventFullList.appendChild(listDate)

      for(const event of events) {
        let listEvent = document.createElement('li')

        let a = document.createElement('a')
        a.textContent = event.title
        a.href = "javascript:void(0)"
        listEvent.appendChild(a)

        listEvent.addEventListener('click', () => {
          displayEvent(event)
        })

        eventFullList.appendChild(listEvent)
      }
    }
  }
}






async function getEvents(startDate, endDate) {
  if(startDate >= earliestLoadedDate && startDate <= latestLoadedDate) { startDate = latestLoadedDate + 1 }
  if(endDate >= earliestLoadedDate && endDate <= latestLoadedDate) { endDate = earliestLoadedDate - 1 }

  if(startDate < endDate) {
    if(earliestLoadedDate < latestLoadedDate && startDate < earliestLoadedDate && endDate > latestLoadedDate) {
      getEvents(startDate, earliestLoadedDate - 1)
      startDate = latestLoadedDate + 1
    }

    if(startDate < earliestLoadedDate) { earliestLoadedDate = startDate }
    if(endDate > latestLoadedDate) { latestLoadedDate = endDate }

    await getEventData(startDate, endDate)
    .then(events => {
      for(const event of events) {
        if(!dates[event.date]) { dates[event.date] = [] }
        dates[event.date].push(event)
        renderEvent(event.date)
      }
    })
  }

  renderEventList()
}

async function getEventData(startDate, endDate) {
  return await fetch(`/events/${startDate}&${endDate}`)
  .then(response => {
    if(!response.ok) { throw new Error("HTTP error " + response.status) }
    return response.json()
  })
  .then(json => {
    const events = json.events
    return events
  })
  .catch(function (err) {
    console.error(err)
  })
}



function clearEventDisplay() {
  eventContainer.style.display = 'none'
  eventTitle.textContent = ""
  eventImage.src = ""
  eventInfo.textContent = ""

  eventListContainer.style.display = 'none'
  eventList.replaceChildren()

  eventFullList.style.display = 'none'

  closeButton.style.display = 'none'
}



function displayEvent(event) {
  clearEventDisplay()

  if(event.title) {
    eventTitle.textContent = event.title
  }

  if(event.image) {
    eventImage.src = `/images/${event.image}`
  }

  if(event.body) { eventInfo.innerHTML = DOMPurify.sanitize(marked.parse(event.body)) }
  else { eventInfo.textContent = "No description provided." }

  eventContainer.style.display = 'block'

  closeButton.style.display = 'block'
}



function displayEventList(list, date) {
  clearEventDisplay()

  let listDate = document.createElement('div')
  listDate.textContent = dateTitle(date)
  eventList.appendChild(listDate)

  for(let i = 0; i < list.length; i++) {
    let event = document.createElement('li')
    let anchor = document.createElement('a')
    if(list[i].title) { anchor.textContent = list[i].title }
    else { anchor.textContent = "(title not provided)" }
    anchor.href = "javascript:void(0)"
    event.appendChild(anchor)

    event.addEventListener('click', () => {
      displayEvent(list[i])
    })

    eventList.appendChild(event)
  }

  eventListContainer.style.display = 'block'

  closeButton.style.display = 'block'
}

function displayEmptyList(date) {
  clearEventDisplay()

  let listDate = document.createElement('div')
  listDate.textContent = dateTitle(date)
  eventList.appendChild(listDate)

  let listInfo = document.createElement('p')
  listInfo.textContent = "There are no events listed for this day."
  eventList.appendChild(listInfo)

  eventListContainer.style.display = 'block'

  closeButton.style.display = 'block'
}



function displayEventFullList() {
  clearEventDisplay()

  eventFullList.style.display = 'block'
}



function dateTitle(date) {
  const d = new Date(date * (1000*3600*24))
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}



async function preloadEvent(eventId) {
  await fetch(`/event/${eventId}`)
  .then(response => {
    if(!response.ok) {
      if(response.status == 404) return false
      else throw new Error("HTTP error " + response.status)
    }
    return response.json()
  })
  .then(event => {
    if(event) {
      const eventDate = new Date(event.date * (1000*3600*24))
      currentMonth = eventDate.getUTCMonth()
      currentYear = eventDate.getUTCFullYear()
      currentEvent = event
    }
  })
  .catch(function (err) {
    console.log(err.name)
    console.error(err)
  })
}



async function checkAdmin() {
  return await fetch('/isadmin')
  .then(response => {
    if(!response.ok) { throw new Error("HTTP error " + response.status) }
    return response.json()
  })
  .then(json => {
    return json
  })
  .catch(function (err) {
    console.error(err)
  })
}






const isAdmin = await checkAdmin()

let urlParams = new URLSearchParams(window.location.search.substring(1))
if(urlParams.get('e')) {
  await preloadEvent(urlParams.get('e'))
}

renderCalendar(currentMonth, currentYear)
getEvents(firstDate, lastDate).then(() => {
  if(currentEvent == -1) {
    displayEventFullList()
  } else {
    displayEvent(currentEvent)
  }

  getEvents(firstDate - 60, lastDate + 60)
})

if(isAdmin) {
  const createButton = document.createElement('button')
  createButton.textContent = "Create New Event"
  eventListContainer.appendChild(createButton)

  const editButton = document.createElement('button')
  editButton.textContent = "Edit"
  eventContainer.appendChild(editButton)

  const deleteButton = document.createElement('button')
  deleteButton.textContent = "Delete"
  eventContainer.appendChild(deleteButton)
}




prevMonthBtn.addEventListener('click', () => {
  currentMonth--
  if (currentMonth < 0) {
    currentMonth = 11
    currentYear--
  }
  renderCalendar(currentMonth, currentYear)
  getEvents(firstDate, lastDate)
  .then(displayEventFullList())
})

nextMonthBtn.addEventListener('click', () => {
  currentMonth++
  if (currentMonth > 11) {
    currentMonth = 0
    currentYear++
  }
  renderCalendar(currentMonth, currentYear)
  getEvents(firstDate, lastDate)
  .then(displayEventFullList())
})

calendarDates.addEventListener('click', (e) => {
  //const clickDate = e.target.getAttribute('date')
  clickDate = Array.prototype.indexOf.call(calendarDates.children, e.target) + firstDate
  console.log(clickDate)

  if(dates[clickDate]) {
    const events = dates[clickDate]
    if(events.length == 1 && !isAdmin) {
      displayEvent(events[0])
    } else {
      displayEventList(events, clickDate)
    }
  } else {
    displayEmptyList(clickDate)
  }
})

closeButton.addEventListener('click', () => {
  displayEventFullList()
})
