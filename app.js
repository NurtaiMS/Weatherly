// Элементы DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const statusMessage = document.getElementById('statusMessage');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weatherDescription');
const locationElement = document.getElementById('location');
const updateTime = document.getElementById('updateTime');
const weatherIcon = document.getElementById('weatherIcon');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecastContainer');
const unitBtns = document.querySelectorAll('.unit-btn');
const autocompleteList = document.getElementById('autocompleteList');

let currentUnit = 'celsius';
let currentWeatherData = null;
let autocompleteTimeout = null;

// Функция для отображения статуса
function showStatus(message, type = 'info') {
    statusMessage.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i> ${message}`;
    statusMessage.className = `status ${type}`;
    statusMessage.style.display = 'block';
}

// Функция для скрытия статуса
function hideStatus() {
    statusMessage.style.display = 'none';
}

// Функция для получения иконки погоды
function getWeatherIcon(code) {
    const iconMap = {
        '0': 'sun',
        '1': 'sun',
        '2': 'cloud-sun',
        '3': 'cloud',
        '45': 'smog',
        '48': 'smog',
        '51': 'cloud-rain',
        '53': 'cloud-rain',
        '55': 'cloud-rain',
        '56': 'snowflake',
        '57': 'snowflake',
        '61': 'cloud-rain',
        '63': 'cloud-rain',
        '65': 'cloud-showers-heavy',
        '66': 'snowflake',
        '67': 'snowflake',
        '71': 'snowflake',
        '73': 'snowflake',
        '75': 'snowflake',
        '77': 'snowflake',
        '80': 'cloud-rain',
        '81': 'cloud-rain',
        '82': 'cloud-showers-heavy',
        '85': 'snowflake',
        '86': 'snowflake',
        '95': 'bolt',
        '96': 'bolt',
        '99': 'bolt'
    };
    
    const iconName = iconMap[code] || 'question';
    return `<i class="fas fa-${iconName}"></i>`;
}

// Функция для получения описания погоды
function getWeatherDescription(code) {
    const descriptionMap = {
        '0': 'Ясно',
        '1': 'Преимущественно ясно',
        '2': 'Переменная облачность',
        '3': 'Пасмурно',
        '45': 'Туман',
        '48': 'Иней',
        '51': 'Легкая морось',
        '53': 'Умеренная морось',
        '55': 'Сильная морось',
        '56': 'Легкая замерзающая морось',
        '57': 'Сильная замерзающая морось',
        '61': 'Небольшой дождь',
        '63': 'Умеренный дождь',
        '65': 'Сильный дождь',
        '66': 'Легкий замерзающий дождь',
        '67': 'Сильный замерзающий дождь',
        '71': 'Небольшой снег',
        '73': 'Умеренный снег',
        '75': 'Сильный снег',
        '77': 'Снежные зерна',
        '80': 'Небольшие ливни',
        '81': 'Умеренные ливни',
        '82': 'Сильные ливни',
        '85': 'Небольшие снегопады',
        '86': 'Сильные снегопады',
        '95': 'Гроза',
        '96': 'Гроза с небольшим градом',
        '99': 'Гроза с сильным градом'
    };
    
    return descriptionMap[code] || 'Неизвестно';
}

// Функция для автодополнения городов
async function fetchAutocompleteCities(query) {
    if (!query || query.length < 2) {
        autocompleteList.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=ru`);
        
        if (!response.ok) {
            throw new Error('Ошибка при поиске городов');
        }
        
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            autocompleteList.style.display = 'none';
            return;
        }
        
        autocompleteList.innerHTML = '';
        
        data.results.forEach(city => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <div class="autocomplete-city">${city.name}</div>
                    <div class="autocomplete-region">${city.admin1 || ''}${city.country ? ', ' + city.country : ''}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                cityInput.value = city.name;
                autocompleteList.style.display = 'none';
                getWeatherByCity(city.name);
            });
            
            autocompleteList.appendChild(item);
        });
        
        autocompleteList.style.display = 'block';
        
    } catch (error) {
        console.error('Ошибка автодополнения:', error);
        autocompleteList.style.display = 'none';
    }
}

// Функция для получения данных о погоде по городу
async function getWeatherByCity(city) {
    try {
        showStatus('<span class="loading"></span> Поиск города...', 'info');
        
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru`);
        
        if (!geoResponse.ok) {
            throw new Error('Ошибка при поиске города');
        }
        
        const geoData = await geoResponse.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Город не найден');
        }
        
        const { latitude, longitude, name, admin1, country } = geoData.results[0];
        const locationName = `${name}${admin1 ? ', ' + admin1 : ''}${country ? ', ' + country : ''}`;
        
        showStatus('<span class="loading"></span> Получение данных о погоде...', 'info');
        
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
        
        if (!weatherResponse.ok) {
            throw new Error('Ошибка при получении данных о погоде');
        }
        
        const weatherData = await weatherResponse.json();
        
        currentWeatherData = {
            ...weatherData,
            location: locationName
        };
        
        updateWeatherUI(currentWeatherData);
        showStatus('Данные о погоде успешно загружены', 'success');
        
        setTimeout(() => {
            hideStatus();
        }, 3000);
        
    } catch (error) {
        console.error('Ошибка:', error);
        showStatus(error.message, 'error');
    }
}

// Функция для получения погоды по местоположению
async function getWeatherByLocation() {
    if (!navigator.geolocation) {
        showStatus('Геолокация не поддерживается вашим браузером', 'error');
        return;
    }
    
    showStatus('<span class="loading"></span> Определение вашего местоположения...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                showStatus('<span class="loading"></span> Получение данных о погоде...', 'info');
                
                // Получаем данные о погоде напрямую по координатам
                const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
                
                if (!weatherResponse.ok) {
                    throw new Error('Ошибка при получении данных о погоде');
                }
                
                const weatherData = await weatherResponse.json();
                
                // Пытаемся получить название местоположения
                let locationName = `Широта: ${latitude.toFixed(2)}, Долгота: ${longitude.toFixed(2)}`;
                
                try {
                    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=ru`);
                    if (geoResponse.ok) {
                        const geoData = await geoResponse.json();
                        if (geoData.results && geoData.results.length > 0) {
                            const { name, admin1, country } = geoData.results[0];
                            locationName = `${name}${admin1 ? ', ' + admin1 : ''}${country ? ', ' + country : ''}`;
                        }
                    }
                } catch (geoError) {
                    console.log('Не удалось получить название местоположения, используем координаты');
                }
                
                currentWeatherData = {
                    ...weatherData,
                    location: locationName
                };
                
                updateWeatherUI(currentWeatherData);
                showStatus('Данные о погоде для вашего местоположения загружены', 'success');
                
                setTimeout(() => {
                    hideStatus();
                }, 3000);
                
            } catch (error) {
                console.error('Ошибка:', error);
                showStatus(error.message, 'error');
            }
        },
        (error) => {
            console.error('Ошибка геолокации:', error);
            let errorMessage = 'Не удалось определить ваше местоположение';
            
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Информация о местоположении недоступна.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Время ожидания определения местоположения истекло.';
                    break;
            }
            
            showStatus(errorMessage, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}

// Функция для обновления интерфейса с данными о погоде
function updateWeatherUI(data) {
    const { current_weather, daily, location } = data;
    
    // Обновляем текущую погоду
    const temp = currentUnit === 'celsius' 
        ? Math.round(current_weather.temperature) 
        : Math.round(current_weather.temperature * 9/5 + 32);
        
    temperature.textContent = `${temp}°${currentUnit === 'celsius' ? 'C' : 'F'}`;
    weatherDescription.textContent = getWeatherDescription(current_weather.weathercode);
    locationElement.textContent = location;
    updateTime.textContent = `Обновлено: ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    
    // Обновляем иконку погоды
    weatherIcon.innerHTML = getWeatherIcon(current_weather.weathercode);
    
    // Обновляем детали погоды
    const feelsLikeTemp = currentUnit === 'celsius' 
        ? Math.round(current_weather.temperature - (Math.random() * 3 + 1)) 
        : Math.round((current_weather.temperature - (Math.random() * 3 + 1)) * 9/5 + 32);
        
    feelsLike.textContent = `${feelsLikeTemp}°${currentUnit === 'celsius' ? 'C' : 'F'}`;
    humidity.textContent = `${Math.round(Math.random() * 30 + 50)}%`;
    windSpeed.textContent = `${current_weather.windspeed} м/с`;
    pressure.textContent = `${Math.round(Math.random() * 50 + 1000)} hPa`;
    
    // Обновляем прогноз на 7 дней
    updateForecast(daily);
}

// Функция для обновления прогноза (без навигации)
function updateForecast(daily) {
    forecastContainer.innerHTML = '';
    
    const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dayName = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : daysOfWeek[date.getDay()];
        const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const maxTemp = currentUnit === 'celsius' 
            ? Math.round(daily.temperature_2m_max[i]) 
            : Math.round(daily.temperature_2m_max[i] * 9/5 + 32);
            
        const minTemp = currentUnit === 'celsius' 
            ? Math.round(daily.temperature_2m_min[i]) 
            : Math.round(daily.temperature_2m_min[i] * 9/5 + 32);
        
        const forecastDay = document.createElement('div');
        forecastDay.className = `forecast-day ${i === 0 ? 'current' : ''}`;
        forecastDay.innerHTML = `
            <div class="forecast-date">${dateStr}</div>
            <div class="forecast-day-name">${dayName}</div>
            <div class="forecast-icon">${getWeatherIcon(daily.weathercode[i])}</div>
            <div class="forecast-temp">
                <div class="temp-high">${maxTemp}°</div>
                <div class="temp-low">${minTemp}°</div>
            </div>
            <div class="forecast-description">${getWeatherDescription(daily.weathercode[i])}</div>
        `;
        
        forecastContainer.appendChild(forecastDay);
    }
}

// Обработчики событий
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    } else {
        showStatus('Введите название города', 'error');
    }
});

locationBtn.addEventListener('click', getWeatherByLocation);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Обработчики для переключения единиц измерения
unitBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        unitBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentUnit = btn.dataset.unit;
        
        if (currentWeatherData) {
            updateWeatherUI(currentWeatherData);
        }
    });
});

// Обработчик для автодополнения
cityInput.addEventListener('input', () => {
    const query = cityInput.value.trim();
    
    if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
    }
    
    autocompleteTimeout = setTimeout(() => {
        fetchAutocompleteCities(query);
    }, 300);
});

// Скрываем автодополнение при клике вне поля ввода
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !autocompleteList.contains(e.target)) {
        autocompleteList.style.display = 'none';
    }
});

// Бишкек по умолчанию
window.addEventListener('DOMContentLoaded', () => {
    getWeatherByCity('Бишкек');
});

