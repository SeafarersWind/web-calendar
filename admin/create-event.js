const form = document.getElementById("event-form");
const submitBtn = document.getElementById("submit-btn");
const submitText = document.getElementById("submit-text");
const pageTitle = document.getElementById('page-title');

const toggleTime = document.getElementById('toggle_time');
const toggleAddress = document.getElementById('toggle_address');
const timeFields = document.getElementById('time-fields');
const addressField = document.getElementById('address-field');

// Get event ID from URL if editing
const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('id');

if (editId) {
    pageTitle.textContent = 'Edit Event';
    submitText.textContent = 'Update Event';
    loadEventData(editId);
}

// UI Toggles
toggleTime.addEventListener('change', () => {
    timeFields.style.display = toggleTime.checked ? 'grid' : 'none';
    if (!toggleTime.checked) {
        document.getElementById('event_time_start').value = '';
        document.getElementById('event_time_end').value = '';
    }
});

toggleAddress.addEventListener('change', () => {
    addressField.style.display = toggleAddress.checked ? 'block' : 'none';
    if (!toggleAddress.checked) {
        document.getElementById('event_address').value = '';
    }
});

async function loadEventData(id) {
    try {
        const response = await fetch(`/event/${id}`);
        const event = await response.json();
        
        if (event) {
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
            
            // Set toggles
            toggleTime.checked = !!(event.time_start || event.time_end);
            timeFields.style.display = toggleTime.checked ? 'grid' : 'none';
            
            toggleAddress.checked = !!event.address;
            addressField.style.display = toggleAddress.checked ? 'block' : 'none';

            // Store current image info for the backend
            if (event.image) {
                const imgInfo = document.createElement('p');
                imgInfo.style.fontSize = '0.9rem';
                imgInfo.style.marginTop = '0.5rem';
                imgInfo.style.color = 'var(--accent)';
                imgInfo.innerHTML = `<i class="fa-solid fa-image"></i> Current image: ${event.image}`;
                document.getElementById('event_image').parentNode.appendChild(imgInfo);
                
                const hiddenImg = document.createElement('input');
                hiddenImg.type = 'hidden';
                hiddenImg.name = 'current_image';
                hiddenImg.value = event.image;
                form.appendChild(hiddenImg);
            }
        }
    } catch (e) {
        console.error('Error loading event data:', e);
        Swal.fire({
            icon: 'error',
            title: 'Failed to load event',
            text: 'We couldn\'t find the event you\'re trying to edit.',
            background: '#161b22',
            color: '#e6edf3'
        });
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // UI Loading state
    submitBtn.disabled = true;
    submitText.textContent = 'Saving...';

    const formData = new FormData(form);
    
    if (editId) {
        formData.append('id', editId);
    }

    const dateStr = formData.get('date');
    if (dateStr) {
        const date = Date.UTC(
            parseInt(dateStr.substr(0, 4)),
            parseInt(dateStr.substr(5, 2)) - 1,
            parseInt(dateStr.substr(8, 2))
        ) / (1000*3600*24);
        formData.set('date', date);
    }

    const endpoint = editId ? '/admin/edit-event' : '/admin/create-event';

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
            headers: auth.getHeaders()
        });

        if (response.ok) {
            await Swal.fire({
                icon: 'success',
                title: editId ? 'Updated!' : 'Published!',
                text: editId ? 'Event updated successfully.' : 'Your event is now live.',
                background: '#161b22',
                color: '#e6edf3',
                timer: 1500,
                showConfirmButton: false
            });
            window.location.href = 'dashboard.html';
        } else {
            const errorData = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: errorData.error || 'Something went wrong.',
                background: '#161b22',
                color: '#e6edf3'
            });
            submitBtn.disabled = false;
            submitText.textContent = editId ? 'Update Event' : 'Publish Event';
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Network error while saving.', 'error');
        submitBtn.disabled = false;
        submitText.textContent = editId ? 'Update Event' : 'Publish Event';
    }
});
