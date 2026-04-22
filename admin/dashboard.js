const eventList = document.getElementById('event-list')
const eventMenu = document.getElementById('event-menu')
const holdingArea = document.getElementById('holding-area')
const viewButton = document.getElementById('view-button')
const editButton = document.getElementById('edit-button')
const deleteButton = document.getElementById('delete-button')

const eventContainer = document.getElementById('event-container')
const noEventPlaceholder = document.getElementById('no-event-selected')
const detailContent = document.getElementById('event-detail-content')
const eventTitle = document.getElementById('event-title')
const eventImage = document.getElementById('event-image')
const eventInfo = document.getElementById('event-info')

const metaDate = document.querySelector('#meta-date span')
const metaTime = document.querySelector('#meta-time span')
const metaLocation = document.querySelector('#meta-location span')

var currentEventId = -1

function renderEvents(events) {
  if (eventMenu && holdingArea && eventMenu.parentNode !== holdingArea) {
    holdingArea.appendChild(eventMenu)
  }

  eventList.innerHTML = ''
  
  if (events.length === 0) {
    eventList.innerHTML = '<p style="padding: 1rem; color: var(--fg-dim); font-size: 0.9rem; text-align: center;">No events scheduled.</p>';
    return;
  }

  events.forEach(event => {
    const eventLink = document.createElement('a')
    eventLink.href = "javascript:void(0)"
    eventLink.className = 'event-link'
    
    const date = new Date(event.date * (1000*3600*24))
    const dateText = !isNaN(date) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Invalid Date"
    
    eventLink.innerHTML = `
        <div style="font-size: 0.75rem; color: var(--accent); margin-bottom: 0.2rem; font-weight: 600;">${dateText}</div>
        <div style="font-weight: 500;">${event.title}</div>
    `
    
    if (currentEventId === event.id) eventLink.classList.add('active');
    
    eventList.appendChild(eventLink)

    eventLink.addEventListener('click', () => {
      currentEventId = event.id
      document.querySelectorAll('.event-link').forEach(el => el.classList.remove('active'));
      eventLink.classList.add('active');

      // Update UI
      noEventPlaceholder.style.display = 'none';
      detailContent.style.display = 'block';
      detailContent.classList.add('fade-in');

      eventTitle.textContent = event.title
      
      // Meta data
      metaDate.textContent = dateText;
      metaTime.textContent = (event.time_start || '') + (event.time_end ? ' - ' + event.time_end : '');
      metaLocation.textContent = event.address || 'No location specified';
      
      // Visibility of meta tags
      document.getElementById('meta-time').style.display = event.time_start ? 'inline' : 'none';
      document.getElementById('meta-location').style.display = event.address ? 'inline' : 'none';

      if(event.image) {
        eventImage.style.display = 'block'
        eventImage.src = `/images/${event.image}`
      } else {
        eventImage.style.display = 'none'
      }
      
      eventInfo.innerHTML = DOMPurify.sanitize(marked.parse(event.body))
      detailContent.appendChild(eventMenu)
    })
  })
}

viewButton.addEventListener('click', () => {
  if (currentEventId !== -1) window.location.href = `/?e=${currentEventId}`
})

editButton.addEventListener('click', () => {
  if (currentEventId !== -1) window.location.href = `/admin/create-event?id=${currentEventId}`
})

deleteButton.addEventListener('click', async () => {
  if (currentEventId === -1) return;
  
  const result = await Swal.fire({
    title: 'Delete Event?',
    text: "This action cannot be undone.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#238636',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
    background: '#161b22',
    color: '#e6edf3'
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`/admin/delete/${currentEventId}`, {
      method: "POST",
      headers: auth.getHeaders()
    })
    
    if (response.ok) {
        holdingArea.appendChild(eventMenu)
        await getEvents() 
        detailContent.style.display = 'none';
        noEventPlaceholder.style.display = 'flex';
        currentEventId = -1;
        Swal.fire({
            title: 'Deleted!',
            text: 'Your event has been removed.',
            icon: 'success',
            background: '#161b22',
            color: '#e6edf3',
            timer: 2000,
            showConfirmButton: false
        });
    } else {
        const errorData = await response.json().catch(() => ({}));
        Swal.fire('Error', errorData.error || 'Failed to delete event', 'error');
    }
  } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Network error while deleting event', 'error');
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
