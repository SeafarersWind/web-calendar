const form = document.querySelector("form");





function updateCheckbox(checkbox) {
  const field = document.getElementById(checkbox.parentNode.getAttribute('for'))
  if(checkbox.checked) {
    field.removeAttribute('disabled')
    field.setAttribute('required', '')
    if(field.id == 'event_icon') {
      extraField = document.getElementById('event_icon_priority')
      extraField.removeAttribute('disabled')
      extraField.setAttribute('required', '')
    }
  } else {
    field.removeAttribute('required')
    field.setAttribute('disabled', '')
    if(field.id == 'event_icon') {
      extraField = document.getElementById('event_icon_priority')
      extraField.removeAttribute('required')
      extraField.setAttribute('disabled', '')
    }
  }
}



async function sendData() {
  const formData = new FormData(form);

  var data = {}

  for(const entry of formData.entries()) {
    if(entry[0] != 'image') { data[entry[0]] = entry[1] }
    else {
      console.log(entry[1])
      data['image'] = true
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
    });
    console.log(await response.json());
  } catch (e) {
    console.error(e);
  }
}







const checkboxes = document.querySelectorAll('input[type=checkbox]')

for(const checkbox of checkboxes) {
  updateCheckbox(checkbox)
  checkbox.addEventListener('change', (e) => updateCheckbox(e.target))
}



// form.addEventListener("submit", (event) => {
//   event.preventDefault();
//   sendData();
// });
