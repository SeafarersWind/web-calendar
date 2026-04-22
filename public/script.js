
const calendarDates = document.querySelector('.calendar-dates')
const monthYear = document.getElementById('month-year')
const prevMonthBtn = document.getElementById('prev-month')
const nextMonthBtn = document.getElementById('next-month')

const eventTitle = document.getElementById('event-title')
const eventImage = document.getElementById('event-image')
const eventInfo = document.getElementById('event-info')
const eventList = document.getElementById('event-list')

const noEventPlaceholder = document.getElementById('no-event-selected')
const eventDetailView = document.getElementById('event-detail-view')
const detailDate = document.querySelector('#detail-date span')
const detailLocation = document.querySelector('#detail-location span')

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

function renderCalendar(month, year) {
  calendarDates.innerHTML = ''
  monthYear.textContent = `${months[month]} ${year}`

  const todayLocal = new Date((new Date()).toLocaleString('en-US', { timeZone: 'America/Vancouver' }))
  const today = new Date(Date.UTC(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate()))
  const todayValue = today.getTime() / (1000*3600*24)

  const monthStart = new Date(Date.UTC(year, month, 1))
  const monthEnd = new Date(Date.UTC(year, month+1, 0))

  const monthStartValue = monthStart.getTime() / (1000*3600*24)
  const monthEndValue = monthEnd.getTime() / (1000*3600*24)

  const firstWeekday = monthStart.getUTCDay()
  const lastWeekday = monthEnd.getUTCDay()

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

    entry.textContent = entryDateNum
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
  if(date < firstDate || date > lastDate) return
  const eventData = dates[date]
  if(eventData && eventData.length) {
    const entry = calendarDates.childNodes[date - firstDate]
    entry.classList.add('event')
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

    await fetch(`/events/${startDate}&${endDate}`)
    .then(res => res.json())
    .then(json => {
      for(const event of json.events) {
        if(!dates[event.date]) { dates[event.date] = [] }
        dates[event.date].push(event)
        renderEvent(event.date)
      }
    })
  }
}

function displayEvent(event) {
  noEventPlaceholder.style.display = 'none'
  eventDetailView.style.display = 'block'
  eventDetailView.classList.remove('fade-in')
  void eventDetailView.offsetWidth // trigger reflow
  eventDetailView.classList.add('fade-in')

  eventTitle.textContent = event.title
  
  if(event.image) {
    eventImage.style.display = 'block'
    eventImage.src = `/images/${event.image}`
  } else {
    eventImage.style.display = 'none'
  }

  const d = new Date(event.date * (1000*3600*24))
  detailDate.textContent = `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
  detailLocation.textContent = event.address || 'No location specified'
  document.getElementById('detail-location').style.display = event.address ? 'inline' : 'none'

  if(event.body) { eventInfo.innerHTML = DOMPurify.sanitize(marked.parse(event.body)) }
  else { eventInfo.textContent = "No description provided." }
  
  // Clear other list
  eventList.innerHTML = ''
  document.getElementById('event-list-section').style.display = 'none'
}

function displayEventList(list, dateValue) {
  noEventPlaceholder.style.display = 'none'
  eventDetailView.style.display = 'block'
  
  eventTitle.textContent = `Events on ${months[new Date(dateValue * 86400000).getUTCMonth()]} ${new Date(dateValue * 86400000).getUTCDate()}`
  eventImage.style.display = 'none'
  eventInfo.innerHTML = ''
  
  document.getElementById('detail-date').style.display = 'none'
  document.getElementById('detail-location').style.display = 'none'

  eventList.innerHTML = ''
  list.forEach(event => {
    let item = document.createElement('div')
    item.className = 'event-link'
    item.style.marginBottom = '1rem'
    item.innerHTML = `<strong>${event.time_start || ''}</strong> ${event.title}`
    item.onclick = () => displayEvent(event)
    eventList.appendChild(item)
  })
  
  document.getElementById('event-list-section').style.display = 'block'
}

async function preloadEvent(eventId) {
    const res = await fetch(`/event/${eventId}`)
    const event = await res.json()
    if(event) {
        const eventDate = new Date(event.date * 86400000)
        currentMonth = eventDate.getUTCMonth()
        currentYear = eventDate.getUTCFullYear()
        currentEvent = event
    }
}

let urlParams = new URLSearchParams(window.location.search)
if(urlParams.get('e')) {
  await preloadEvent(urlParams.get('e'))
}

renderCalendar(currentMonth, currentYear)
getEvents(firstDate, lastDate).then(() => {
  if(currentEvent !== -1) {
    displayEvent(currentEvent)
  }
})

prevMonthBtn.onclick = () => {
  currentMonth--
  if (currentMonth < 0) { currentMonth = 11; currentYear-- }
  renderCalendar(currentMonth, currentYear)
  getEvents(firstDate, lastDate)
}

nextMonthBtn.onclick = () => {
  currentMonth++
  if (currentMonth > 11) { currentMonth = 0; currentYear++ }
  renderCalendar(currentMonth, currentYear)
  getEvents(firstDate, lastDate)
}

calendarDates.onclick = (e) => {
  if (!e.target.classList.contains('date')) return
  const index = Array.from(calendarDates.children).indexOf(e.target)
  const clickDate = index + firstDate
  
  if(dates[clickDate]) {
    const evs = dates[clickDate]
    if(evs.length === 1) displayEvent(evs[0])
    else displayEventList(evs, clickDate)
  }
}

window.closeDetails = () => {
    eventDetailView.style.display = 'none'
    noEventPlaceholder.style.display = 'flex'
}
