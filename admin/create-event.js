const form = document.querySelector("form");
const submitButton = form.querySelector('input[type="submit"]');
const h1 = document.querySelector('h1');

// Get event ID from URL if editing
const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('id');

if (editId) {
    h1.textContent = 'Edit Event';
    submitButton.value = 'Update Event';
    loadEventData(editId);
}

async function loadEventData(id) {
    try {
        const response = await fetch(`/event/${id}`);
        const event = await response.json();
        
        if (event) {
            // Fill form fields
            form.title.value = event.title;
            form.body.value = event.body;
            form.address.value = event.address || '';
            form.time_start.value = event.time_start || '';
            form.time_end.value = event.time_end || '';
            form.icon.value = event.icon || '';
            form.icon_priority.value = event.icon_priority || '';
            
            // Handle date
            const date = new Date(event.date * (1000*3600*24));
            form.date.value = date.toISOString().split('T')[0];
            
            // Enable checkboxes for fields that have values
            if (event.address) { 
                const cb = document.querySelector('label[for="event_address"] input');
                cb.checked = true;
                updateCheckbox(cb);
            }
            if (event.time_start || event.time_end) {
                const cb = document.querySelector('label[for="event_time"] input');
                cb.checked = true;
                updateCheckbox(cb);
            }
            if (event.icon) {
                const cb = document.querySelector('label[for="event_icon"] input');
                cb.checked = true;
                updateCheckbox(cb);
            }

            // Store current image info
            const imgInput = document.createElement('input');
            imgInput.type = 'hidden';
            imgInput.name = 'current_image';
            imgInput.value = event.image || '';
            form.appendChild(imgInput);
            
            const idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.name = 'id';
            idInput.value = event.id;
            form.appendChild(idInput);
        }
    } catch (e) {
        console.error('Error loading event data:', e);
    }
}

function updateCheckbox(checkbox) {
  const fieldLabel = checkbox.parentNode;
  const targetId = fieldLabel.getAttribute('for');
  const field = document.getElementById(targetId);
  if (!field) return;

  if(checkbox.checked) {
    field.removeAttribute('disabled')
    field.setAttribute('required', '')
    if(field.id == 'event_icon') {
      const extraField = document.getElementById('event_icon_priority')
      if (extraField) extraField.removeAttribute('disabled')
    }
  } else {
    field.removeAttribute('required')
    field.setAttribute('disabled', '')
    if(field.id == 'event_icon') {
      const extraField = document.getElementById('event_icon_priority')
      if (extraField) extraField.setAttribute('disabled', '')
    }
  }
}

const checkboxes = document.querySelectorAll('input[type=checkbox]')

for(const checkbox of checkboxes) {
  updateCheckbox(checkbox)
  checkbox.addEventListener('change', (e) => updateCheckbox(e.target))
}

form.addEventListener("submit", async (e) => {
  e.preventDefault()

  const formData = new FormData(form)
  
  // Ensure the ID is in the FormData if we are editing
  if (editId && !formData.has('id')) {
    formData.append('id', editId);
  }

  const dateStr = formData.get('date')
  if (dateStr) {
    const date = Date.UTC(
      parseInt(dateStr.substr(0, 4)),
      parseInt(dateStr.substr(5, 2)) - 1,
      parseInt(dateStr.substr(8, 2))
    ) / (1000*3600*24)
    formData.set('date', date)
  }

  const endpoint = editId ? '/admin/edit-event' : '/admin/create-event';
  console.log('Sending data to:', endpoint);
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }

  try {
      const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: auth.getHeaders()
      });

      if (response.ok) {
          window.location.href = '/admin/dashboard';
      } else if (response.status === 401 || response.status === 403) {
          auth.logout();
      } else {
          const errorData = await response.json();
          alert('Error saving event: ' + (errorData.error || response.statusText));
      }
  } catch (err) {
      console.error(err);
      alert('Network error while saving event');
  }
});
