const form = document.querySelector("form");

const checkboxes = document.querySelectorAll('input[type=checkbox]')
const inputImage = document.getElementById('event_image')
const inputImageExtra = document.getElementById('event_image_extra')

const editing = window.location.pathname == '/admin/edit-event'
const urlParams = new URLSearchParams(window.location.search)
const editId = editing ? urlParams.get('e') : null
var usingCurrentImage = false





async function prepareForm() {
  if(editing) {
    await loadEventData(editId)
  }

  for(const cb of checkboxes) {
    forInput = cb.parentNode.getAttribute('for')
    if(forInput == 'event_image') {
      updateImgCheckbox(cb)
      cb.addEventListener('change', (e) => updateImgCheckbox(e.target))
    } else if(forInput == 'event_icon') {
      updateIconCheckbox(cb)
      cb.addEventListener('change', (e) => updateIconCheckbox(e.target))
    } else {
      updateCheckbox(cb)
      cb.addEventListener('change', (e) => updateCheckbox(e.target))
    }
  }

}

async function loadEventData(id) {
  try {
    const response = await fetch(`/event/${id}`);
    const event = await response.json()

    if(event) {
      form.title.value = event.title
      form.body.value = event.body
      form.address.value = event.address || ''
      form.time_start.value = event.time_start || ''
      form.time_end.value = event.time_end || ''
      form.icon.value = event.icon || ''
      form.icon_priority.value = event.icon_priority || '0'

      const date = new Date(event.date * (1000*3600*24))
      form.date.value = date.toISOString().split('T')[0]

      for(const cb of checkboxes) cb.checked = false
      if (event.address) {
        document.querySelector('label[for="event_address"] input').checked = true
      }
      if (event.time_start) {
        document.querySelector('label[for="event_time_start"] input').checked = true
      }
      if (event.time_end) {
        document.querySelector('label[for="event_time_end"] input').checked = true
      }
      if (event.icon) {
        document.querySelector('label[for="event_icon"] input').checked = true
      }

      const currentImageInput = document.createElement('input')
      currentImageInput.type = 'hidden'
      currentImageInput.name = 'current_image'
      currentImageInput.id = 'event_current_image'
      currentImageInput.value = event.image || ''
      form.appendChild(currentImageInput)
      if(event.image) {
        usingCurrentImage = true
        document.querySelector('label[for="event_image"] input').checked = true
        inputImage.classList.add('short')
        inputImageExtra.classList.remove('hidden')
        inputImage.removeAttribute('required')
        inputImage.addEventListener('change', (e) => {
          if(inputImage.value == "") {
            usingCurrentImgae = true
            inputImage.classList.add('short')
            inputImageExtra.classList.remove('hidden')
            inputImage.removeAttribute('required')
          } else {
            usingCurrentImage = false
            inputImage.classList.remove('short')
            inputImageExtra.classList.add('hidden')
          }
        })
      }

      const idInput = document.createElement('input')
      idInput.type = 'hidden'
      idInput.name = 'id'
      idInput.value = event.id
      form.appendChild(idInput)
    }
  }

  catch (e) {
      console.error('Error loading event data:', e)
  }
}



function updateCheckbox(cb) {
  const field = document.getElementById(cb.parentNode.getAttribute('for'))
  if(cb.checked) {
    field.setAttribute('required', '')
    field.removeAttribute('disabled')
  } else {
    field.removeAttribute('required')
    field.setAttribute('disabled', '')
  }
}

function updateImgCheckbox(cb) {
  const field = document.getElementById(cb.parentNode.getAttribute('for'))
  const extraField = document.getElementById('event_image_extra')
  const otherField = document.getElementById('event_current_image')
  if(cb.checked) {
    field.removeAttribute('disabled')
    if(!usingCurrentImage) field.setAttribute('required', '')
    else {
      extraField.textContent = '(keep original image)'
      otherField.removeAttribute('disabled')
    }
  } else {
    field.setAttribute('disabled', '')
    if(!usingCurrentImage) field.removeAttribute('required')
    else {
      extraField.textContent = '(remove image)'
      otherField.setAttribute('disabled', '')
    }
  }
}

function updateIconCheckbox(cb) {
  const field = document.getElementById(cb.parentNode.getAttribute('for'))
  const extraField = document.getElementById('event_icon_priority')
  if(cb.checked) {
    field.setAttribute('required', '')
    field.removeAttribute('disabled')
    extraField.removeAttribute('disabled')
  } else {
    field.removeAttribute('required')
    field.setAttribute('disabled', '')
    extraField.setAttribute('disabled', '')
  }
}



async function sendData() {
  const formData = new FormData(form)

  var data = {}

  for(const entry of formData.entries()) {
    if(entry[0] != 'image' && entry[0] != 'date') { data[entry[0]] = entry[1] }
    else if(entry[0] == 'image') {
      data['image'] = true
    } else {
      console.log("?")
      data['date'] = Date.UTC(entry[1]).getTime() / (1000*3600*24)
      console.log(data['date'])
    }
  }
  console.log(data)

  var json = JSON.stringify(data);

  try {
    console.log(json)
    const response = await fetch(`/create-event`, {
      method: "POST",
      body: json,
      headers: {
        "Content-Type": "application/json"
      }
    })
    console.log(await response.json())
  } catch (e) {
    console.error(e);
  }
}





prepareForm()

form.addEventListener("submit", async (e) => {
  e.preventDefault()

  const formData = new FormData(form)
  const dateStr = formData.get('date')
  const date = Date.UTC(
    parseInt(dateStr.substr(0, 4)),
    parseInt(dateStr.substr(5, 2)) - 1,
    parseInt(dateStr.substr(8, 2))
  ) / (1000*3600*24)
  formData.set('date', date)

  console.log(formData)

  const endpoint = editing ? '/admin/edit-event' : '/admin/create-event'
  try {
    const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: auth.getHeaders()
    })

    if (response.ok) {
        window.location.href = '/admin/dashboard'
    } else if (response.status === 401 || response.status === 403) {
        auth.logout()
    } else {
        const errorData = await response.json()
        alert('Error saving event: ' + (errorData.error || response.statusText))
    }
  }

  catch(err) {
      console.error(err);
      alert('Network error while saving event');
  }
})
