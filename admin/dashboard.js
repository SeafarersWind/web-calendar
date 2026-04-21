const eventList = document.getElementById('event-list')
const eventMenu = document.getElementById('event-menu')
const viewButton = document.getElementById('view-button')
const editButton = document.getElementById('edit-button')
const deleteButton = document.getElementById('delete-button')

const eventTitle = document.getElementById('event-title')
const eventImage = document.getElementById('event-image')
const eventInfo = document.getElementById('event-info')

var currentEventId = -1



function renderEvents(events) {
  for(const event of events) {
    const listEvent = document.createElement('ol')
    eventList.appendChild(listEvent)

    const eventLink = document.createElement('a')
    eventLink.href = "javascript:void(0)"
    const date = new Date(event.date * (1000*3600*24))
    const dateText = !isNaN(date) ? `${
      String(date.getUTCFullYear()).padStart(4,'0')}.${
      String(date.getUTCMonth()+1).padStart(2,'0')}.${
      String(date.getUTCDate()).padStart(2,'0')}`
    : "INVALID DATE"
    eventLink.textContent = `${dateText}  ${event.title}`
    listEvent.appendChild(eventLink)


    eventLink.addEventListener('click', (e) => {
      eventTitle.textContent = event.title
      if(event.image) {
        eventImage.style.display = 'block'
        eventImage.src = `/images/${event.image}`
      }
      eventInfo.innerHTML = DOMPurify.sanitize(marked.parse(event.body))

      listEvent.appendChild(eventMenu)

      currentEventId = event.id
    })
  }
}

async function getEvents() {
  try {
    const response = await fetch(`dashboard/events`, {
      method: "GET"
    })
    renderEvents((await response.json()).events)
  } catch (e) {
    console.error(e)
  }
}



getEvents()



viewButton.addEventListener('click', (e) => {
  window.location.href = `/?e=${currentEventId}`
})

editButton.addEventListener('click', (e) => {
  window.location.href = `/admin/edit-event/?e=${currentEventId}`
})

deleteButton.addEventListener('click', (e) => {
  fetch(`delete/${currentEventId}`, {
    method: "POST",
    redirect: 'follow'
  })
  .then(response => {
      window.location.href = response.url
  })
  .catch(function(err) {
      console.info(err + " url: " + url);
  })
})
