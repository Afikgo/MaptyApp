'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map, mapEvent;
class Workout {
  date = new Date();
  id = String(this.date.getTime()).slice(-4);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.time = this.time();
  }
  click() {
    this.clicks++;
  }

  time() {
    const dateM = months[this.date.getMonth()];
    const dateD = this.date.getDate();
    return `${dateM} ${dateD}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.pace = distance / duration;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elev) {
    super(coords, distance, duration);
    this.elev = elev;
    this.speed = distance / (duration / 60);
  }
}

class App {
  workouts = [];
  map;
  mapEvent;

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    inputType.addEventListener('change', this._toggleField);
    form.addEventListener('submit', this._newWorkOut.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('cannot get your location');
      }
    );
  }

  _loadMap(e) {
    const { latitude, longitude } = e.coords;
    const coords = [latitude, longitude];
    this.map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.map.on('click', this._showForm.bind(this));
    this.workouts.forEach(work => this.render(work));
  }

  _showForm(mapE) {
    this.mapEvent = mapE;

    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(e) {
    e.preventDefault();
    let workout;

    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.mapEvent.latlng;
    const coords = [lat, lng];

    const isNumber = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const isPositive = (...inputs) => inputs.every(inp => inp > 0);

    if (inputType.value === 'running') {
      const cadence = +inputCadence.value;
      if (
        !isNumber(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return alert('insert positive inputs ');
      workout = new Running(coords, distance, duration, cadence);
    }
    if (inputType.value === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !isNumber(distance, duration, elevation) ||
        !isPositive(distance, duration)
      )
        return alert('insert inputs');
      workout = new Cycling(coords, distance, duration, elevation);
    }

    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    this.workouts.push(workout);
    this.render(workout);

    this._hideForm();
    this._insertHtml(workout);
    this._setLocalStorage();
  }

  render(workout) {
    L.marker(workout.coords)
      .addTo(this.map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type} on ${workout.time}`)
      .openPopup();
  }

  _hideForm() {
    form.classList.add('hidden');
  }

  _insertHtml(workout) {
    const html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.type} ${workout.time}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃' : '🚴‍♂️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              workout.type === 'running' ? workout.pace : workout.speed
            }</span>
            <span class="workout__unit">${
              workout.type === 'running' ? 'min/km' : 'km/h'
            }</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🦵' : '⛰️'
            }</span>
            <span class="workout__value">${
              workout.type === 'running' ? workout.pace : workout.speed
            }</span>
            <span class="workout__unit">${
              workout.type === 'running' ? 'spm' : 'm'
            }</span>
          </div>
          
        </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.workouts.find(
      workout => workout.id === workoutEl.dataset.id
    );
    this.map.setView(workout.coords, 13);
    workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.workouts = data;

    this.workouts.forEach(work => this._insertHtml(work));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
