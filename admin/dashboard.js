const eventList = document.getElementById('event-list')
const eventMenu = document.getElementById('event-menu')
const holdingArea = document.getElementById('holding-area')
const viewButton = document.getElementById('view-button')
const editButton = document.getElementById('edit-button')
const deleteButton = document.getElementById('delete-button')

const eventTitle = document.getElementById('event-title')
const eventImage = document.getElementById('event-image')
const eventInfo = document.getElementById('event-info')

var currentEventId = -1

function renderEvents(events) {
  // IMPORTANT FIX: Move the menu back to the holding area before clearing the list
  // so it doesn't get destroyed by the innerHTML = ''
  if (eventMenu && holdingArea && eventMenu.parentNode !== holdingArea) {
    holdingArea.appendChild(eventMenu)
  }

  eventList.innerHTML = '' // Now safe to clear

  if (events.length === 0) {
    eventList.innerHTML = '<p style="padding-left: 1rem; color: #888;">No events found.</p>';
    return;
  }

  for (const event of events) {
    const listEvent = document.createElement('li')
    listEvent.style.listStyle = 'none'
    listEvent.style.marginBottom = '0.5rem'

    const eventLink = document.createElement('a')
    eventLink.href = "javascript:void(0)"
    eventLink.className = 'event-link' // For potential styling

    const date = new Date(event.date * (1000 * 3600 * 24))
    const dateText = !isNaN(date) ? `${String(date.getUTCFullYear()).padStart(4, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`
      : "INVALID DATE"

    eventLink.textContent = `${dateText}  ${event.title}`
    listEvent.appendChild(eventLink)
    eventList.appendChild(listEvent)

    eventLink.addEventListener('click', (e) => {
      // 1. Set current ID
      currentEventId = event.id

      // 2. Clear previous active states (optional UI Polish)
      document.querySelectorAll('.event-link').forEach(el => el.style.fontWeight = 'normal');
      eventLink.style.fontWeight = 'bold';

      // 3. Update side view
      eventTitle.textContent = event.title
      if (event.image) {
        eventImage.style.display = 'block'
        eventImage.src = `/images/${event.image}`
      } else {
        eventImage.style.display = 'none'
      }
      eventInfo.innerHTML = DOMPurify.sanitize(marked.parse(event.body))

      // 4. Move the menu to this item
      listEvent.appendChild(eventMenu)
    })
  }
}

// Action button listeners (Global)
viewButton.addEventListener('click', (e) => {
  if (currentEventId !== -1) window.location.href = `/?e=${currentEventId}`
})

editButton.addEventListener('click', (e) => {
  if (currentEventId !== -1) window.location.href = `/admin/create-event?id=${currentEventId}`
})

deleteButton.addEventListener('click', async (e) => {
  debugger;
  if (currentEventId === -1) return;
  const result = await Swal.fire({
    title: 'Are you sure you want to delete?',
    text: "",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`/admin/delete/${currentEventId}`, {
      method: "POST",
      headers: auth.getHeaders()
    })

    if (response.ok) {
      // Move menu back before refreshing
      holdingArea.appendChild(eventMenu)
      getEvents()
      // Clear side view
      eventTitle.textContent = ''
      eventImage.style.display = 'none'
      eventInfo.innerHTML = ''
      currentEventId = -1
    } else if (response.status === 401 || response.status === 403) {
      auth.logout()
    } else {
      const errorData = await response.json().catch(() => ({}));
      alert('Failed to delete event: ' + (errorData.error || response.statusText));
    }
  } catch (err) {
    console.error(err);
    alert('Network error while deleting event');
  }
})

async function getEvents() {
  try {
    const response = await fetch(`/admin/dashboard/events`, {
      method: "GET",
      headers: auth.getHeaders()
    })
    if (response.status === 401 || response.status === 403) {
      auth.logout()
      return
    }
    const data = await response.json()
    renderEvents(data.events)
  } catch (e) {
    console.error(e)
  }
}

getEvents()
