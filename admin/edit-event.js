const form = document.querySelector("form");

const inputImage = document.getElementById('event_image')
const inputImageExtra = document.getElementById('event_image_extra')
var hasOriginalImage = false





function getCheckbox(inputId) {
  for(const label of document.getElementsByTagName('label')) {
    if(label.htmlFor == inputId) {
      for(const child of label.children) {
        if(child.type == 'checkbox') return child
      }
    }
  }
}

function updateCheckbox(checkbox) {
  const field = document.getElementById(checkbox.parentNode.getAttribute('for'))
  if(checkbox.checked) {
    field.removeAttribute('disabled')
    field.setAttribute('required', '')
    if(field.id == 'event_icon') {
      extraField = document.getElementById('event_icon_priority')
      extraField.removeAttribute('disabled')
    }
  } else {
    field.removeAttribute('required')
    field.setAttribute('disabled', '')
    if(field.id == 'event_icon') {
      extraField = document.getElementById('event_icon_priority')
      extraField.setAttribute('disabled', '')
    }
  }
}



async function sendData() {
  const formData = new FormData(form)

  var data = {}

  for(const entry of formData.entries()) {
    console.log(entry)
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



function insertEventData(event) {
  console.log(event)
  for(const input of form) {
    const name = input.getAttribute('name')
    if(name) {
      const checkbox = getCheckbox(input.id)
      const attribute = event[name]
      if(attribute) {
        if(checkbox) checkbox.checked = true
        input.removeAttribute('disabled')
        input.setAttribute('required', '')

        if(input != inputImage && name != 'date') {
          input.value = attribute
        }

        else if(input == inputImage) {
          if(input.value == "") {
            input.classList.add('short')
            inputImageExtra.classList.remove('hidden')
          }
          input.removeAttribute('required')
          hasOriginalImage = true
          console.log(input)
        }

        else if(name == 'date') {
          input.valueAsNumber = attribute * (1000*3600*24)
        }
      } else if(input.id != 'event_icon_priority') {
        checkbox.checked = false
        input.removeAttribute('required')
        input.setAttribute('disabled', '')
      }
    }
  }
}







let urlParams = new URLSearchParams(window.location.search.substring(1))
if(!urlParams.get('e')) {
  window.location.href = `/admin/dashboard`
}

fetch(`/event/${urlParams.get('e')}`)
.then(response => {
  if(!response.ok) { throw new Error("HTTP error " + response.status) }
  return response.json()
})
.then(event => {
  insertEventData(event)
})
.catch(function (err) {
  console.error(err)
  window.location.href = `/admin/dashboard`
})

const checkboxes = document.querySelectorAll('input[type=checkbox]')

for(const checkbox of checkboxes) {
  updateCheckbox(checkbox)
  checkbox.addEventListener('change', (e) => updateCheckbox(e.target))
}



inputImage.addEventListener('change', (e) => {
  if(inputImage.value == "" && hasOriginalImage) {
    inputImage.classList.add('short')
    inputImageExtra.classList.remove('hidden')
    input.removeAttribute('required')
  }

  else if(inputImage.value != "") {
    inputImage.classList.remove('short')
    inputImageExtra.classList.add('hidden')
  }
})



form.addEventListener("submit", async (e) => {
  event.preventDefault()

  const formData = new FormData(form)
  const dateStr = formData.get('date')
  const date = Date.UTC(
    parseInt(dateStr.substr(0, 4)),
    parseInt(dateStr.substr(5, 2)) - 1,
    parseInt(dateStr.substr(8, 2))
  ) / (1000*3600*24)
  formData.set('date', date)

  if(formData.get('image') && formData.get('image').size == 0) {
    formData.set('image', true)
  }

  console.log(formData)

  try {
    const response = await fetch('', {
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
