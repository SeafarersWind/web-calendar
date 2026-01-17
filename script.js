
const calendarDates = document.querySelector('.calendar-dates');
const monthYear = document.getElementById('month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

const eventTitle = document.getElementById('event-title');
const eventImage = document.getElementById('event-image');
const eventInfo = document.getElementById('event-info');
const eventList = document.getElementById('event-list');
const eventFullList = document.getElementById('event-full-list');

const closeButton = document.getElementById('close-button');

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

let dates = {};

const months = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];


// While developing in file:///, json data has to be written in the
// javascript file to avoid Cross-Origin Resource Sharing, which are
// blocked by browsers.
//
// jsonData = '{"year": "2026", \
// 	"day": "1", \
// 	"title": "New Years\' Day", \
// 	"image": "image path", \
// 	"icon": "icon path (optional)", \
// 	"body": "markdown or html" \
// }'
// var event = JSON.parse(jsonData);
//
// When moving this website to a server, delete the above code,
// uncomment the code below, and add type="module" to wherever this
// script is sourced in html.
// 
// import event from "./events/new-years.json" with { type: "json" };
// 
// 
// console.log(event.title);
// console.log(event.year);
// if (event.hasOwnProperty("days")) {
// 	console.log(event.days);
// }

// maybe name the json file after the date and have renderCalendar()
// search for the relevant json file when each date is rendered



async function renderCalendar(month, year) {
	calendarDates.innerHTML = '';
	monthYear.textContent = `${months[month]} ${year}`;
	
	const today = new Date();
	const firstDayOfWeek = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const daysInPrevMonth = new Date(year, month, 0).getDate();
	
	let day = 1 - firstDayOfWeek;
	while(day <= daysInMonth) {
		for(let i = 0; i < 7; i++) {
			const entry = document.createElement('div');
			const entryDate = new Date(year, month, day);
			const entryDay = entryDate.getDate();
			const entryMonth = entryDate.getMonth();
			const entryYear = entryDate.getFullYear();
			
			entry.classList.add('date');
			
			if(day < 1) {
				entry.classList.add('prev-month');
			} else if(day > daysInMonth) {
				entry.classList.add('next-month');
			}
			
			if(
				entryDay === today.getDate() &&
				entryMonth === today.getMonth() &&
				entryYear === today.getFullYear()
			) {
				entry.classList.add('current-date');
			}
			
			let eventPath = `./events/${entryYear}-${entryMonth+1}-${entryDay}.json`;
			
			let eventData = await getEventData(eventPath);
			if(eventData) {
				entry.classList.add('event');
				dates[entryDate] = eventData;
				
				let listDate = document.createElement('div');
				listDate.textContent = entryDate.toDateString();
				eventFullList.appendChild(listDate);
				
				let dateIcons = document.createElement('div');
				dateIcons.classList.add('icons');
				entry.appendChild(dateIcons);
				
				let iconPriority = 0;
				for(let i = 0; i < dates[entryDate].events.length; i++) {
					let listEvent = document.createElement('li');
					let a = document.createElement('a');
					if(dates[entryDate].events[i].title) { a.textContent = dates[entryDate].events[i].title; }
					else { a.textContent = "(title not provided)"; }
					a.href = "javascript:void(0)";
					listEvent.appendChild(a);
					
					listEvent.addEventListener('click', () => {
						displayEvent(dates[entryDate].events[i]);
					});
					
					eventFullList.appendChild(listEvent);
					
					if(dates[entryDate].events[i].icon && dates[entryDate].events[i].icon_priority >= iconPriority) {
						if(dates[entryDate].events[i].icon_priority > iconPriority) {
							dateIcons.replaceChildren();
							iconPriority = dates[entryDate].events[i].icon_priority;
						}
						let icon = document.createElement('img');
						icon.src = `events/icons/${dates[entryDate].events[i].icon}`;
						icon.classList.add('icon');
						dateIcons.appendChild(icon);
					}
				}
			}
			
			let entryText = document.createElement('div');
			entryText.classList.add('date-num');
			entryText.textContent = entryDay;
			entry.appendChild(entryText);
			
			
			calendarDates.appendChild(entry);
			day++;
		}
	}
	
	displayEventFullList();
}

async function getEventData(eventPath) {
	return await fetch(eventPath)
	.then(response => {
		if(!response.ok) { throw new Error("HTTP error " + response.status); }
		return response.json();
	})
	.then(json => {
		return json;
	})
	.catch(function (err) {
		if(!err instanceof TypeError || err.message != "NetworkError when attempting to fetch resource.") {
			console.error(err);
		}
		
		return false;
	})
}



function clearEvent() {
	eventTitle.textContent = "";
	eventTitle.style.display = 'none';
	eventImage.src = "";
	eventImage.style.display = 'none';
	eventInfo.textContent = "";
	eventInfo.style.display = 'none';
	eventList.replaceChildren();
	eventList.style.display = 'none';
	eventFullList.style.display = 'none';
	closeButton.style.display = 'none';
}



function displayEvent(event) {
	console.log(event);
	clearEvent();
	
	if(event.title) {
		eventTitle.style.display = 'block';
		eventTitle.textContent = event.title;
	}
	
	if(event.image) {
		eventImage.style.display = 'block';
		eventImage.src = `events/images/${event.image}`;
	}
	
	if(event.info) { eventInfo.textContent = event.info; }
	else { eventInfo.textContent = "No description provided."; }
	eventInfo.style.display = 'block';
	
	closeButton.style.display = 'block';
}



function displayEventList(list, date) {
	console.log(list);
	clearEvent();
	
	let listDate = document.createElement('div');
	listDate.textContent = date.toDateString();
	eventList.appendChild(listDate);
	
	for(let i = 0; i < list.length; i++) {
		let event = document.createElement('li');
		let anchor = document.createElement('a');
		if(list[i].title) { anchor.textContent = list[i].title; }
		else { anchor.textContent = "(title not provided)"; }
		anchor.href = "javascript:void(0)";
		event.appendChild(anchor);
		
		event.addEventListener('click', () => {
			displayEvent(list[i]);
		});
		
		eventList.appendChild(event);
	}
	
	eventList.style.display = 'block';
	
	closeButton.style.display = 'block';
}



function displayEventFullList() {
	clearEvent();
	
	eventFullList.style.display = 'block';
}






renderCalendar(currentMonth, currentYear);

prevMonthBtn.addEventListener('click', () => {
	currentMonth--;
	if (currentMonth < 0) {
		currentMonth = 11;
		currentYear--;
	}
	renderCalendar(currentMonth, currentYear);
});

nextMonthBtn.addEventListener('click', () => {
	currentMonth++;
	if (currentMonth > 11) {
		currentMonth = 0;
		currentYear++;
	}
	renderCalendar(currentMonth, currentYear);
});

calendarDates.addEventListener('click', (e) => {
	let day = e.target.textContent;
	let month = currentMonth;
	let year = currentYear;
	
	if(e.target.classList.contains('prev-month')) {
		month--;
		if(month < 0) {
			month = 11;
			year--;
		}
	} else if (e.target.classList.contains('next-month')) {
		month++;
		if(month >= 12) {
			month = 0;
			year++;
		}
	}
	
	let clickDate = new Date(year, month, day);
	if(dates[clickDate]) {
		let date = dates[clickDate];
		if(date.events.length == 1) {
			displayEvent(date.events[0]);
		} else {
			displayEventList(date.events, clickDate);
		}
	} else {
		displayEventFullList();
	}
});

closeButton.addEventListener('click', () => {
	displayEventFullList();
})
