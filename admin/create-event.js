const form = document.querySelector("form");





function updateCheckbox(checkbox) {
  const field = document.getElementById(checkbox.parentNode.getAttribute('for'))
  if(checkbox.checked) {
    field.removeAttribute('disabled')
    field.setAttribute('required', '')
  	console.log(field)
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







const checkboxes = document.querySelectorAll('input[type=checkbox]')

for(const checkbox of checkboxes) {
  updateCheckbox(checkbox)
  checkbox.addEventListener('change', (e) => updateCheckbox(e.target))
}



form.addEventListener("submit", (e) => {
  event.preventDefault()

  const formData = new FormData(form)
  const dateStr = formData.get('date')
  const date = Date.UTC(
    parseInt(dateStr.substr(0, 4)),
    parseInt(dateStr.substr(5, 2)) - 1,
    parseInt(dateStr.substr(8, 2))
  ) / (1000*3600*24)
  formData.set('date', date)

  console.log(formData)

  fetch('', {
      method: "POST",
      body: formData,
      redirect: 'follow'
  })
  .then(response => {
      window.location.href = response.url
  })
  .catch(function(err) {
      console.info(err + " url: " + url);
  })
})
