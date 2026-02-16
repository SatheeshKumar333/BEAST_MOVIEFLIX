/* ======================================
   LOG MOVIE – BACKEND INTEGRATED
   Developed by Satheesh Kumar
====================================== */

let selectedMovie = null;
let selectedRating = 0;

document.addEventListener("DOMContentLoaded", () => {
  // Protect page - requires login (check localStorage directly)
  const logged = localStorage.getItem("bmf_logged") === "true";
  if (!logged) {
    alert("Please login to log movies!");
    window.location.href = "login.html";
    return;
  }

  initLogMovie();
});

function initLogMovie() {
  // Set current date/time to local datetime input
  const logTimeInput = document.getElementById("logTime");
  if (logTimeInput) {
    const now = new Date();
    // Adjust to local time string format YYYY-MM-DDTHH:MM
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    logTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Setup search
  setupMovieSearch();

  // Setup emoji rating
  setupEmojiRating();

  // Check for pre-selected movie from URL
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get("id");
  const mediaType = urlParams.get("type") || "movie";
  const movieTitle = urlParams.get("title");

  if (movieId) {
    if (movieTitle) {
      // Optimistic loading if title is known
      displaySelectedMovie({
        id: movieId,
        title: decodeURIComponent(movieTitle),
        name: decodeURIComponent(movieTitle),
        media_type: mediaType
      });
    }
    loadMovieFromURL(movieId, mediaType);
  }

  // Bind Save Button
  const saveBtn = document.getElementById("saveLogBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveMovieLog);
  }
}

// ========== MOVIE SEARCH ==========
function setupMovieSearch() {
  const searchInput = document.getElementById("movieSearch"); // Fixed ID
  const searchResults = document.getElementById("movieSearchResults"); // Fixed ID
  let debounceTimer;

  if (!searchInput) return;

  searchInput.addEventListener("input", async (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);

    if (query.length < 2) {
      if (searchResults) {
        searchResults.style.display = "none";
        searchResults.innerHTML = "";
      }
      return;
    }

    debounceTimer = setTimeout(async () => {
      const results = await searchMovies(query);
      displaySearchResults(results);
    }, 300);
  });

  // Close results on click outside
  document.addEventListener("click", (e) => {
    if (searchResults && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = "none";
    }
  });
}

async function searchMovies(query) {
  try {
    // Using search/multi to find movies and series
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`
    );
    const data = await res.json();
    return data.results?.filter(r => r.media_type === "movie" || r.media_type === "tv").slice(0, 8) || [];
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

function displaySearchResults(results) {
  const container = document.getElementById("movieSearchResults"); // Fixed ID
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = '<div class="no-results">No movies found</div>';
    container.style.display = "block";
    return;
  }

  container.innerHTML = results.map(item => {
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || "").split("-")[0];
    const poster = item.poster_path
      ? `${TMDB_IMG}${item.poster_path}`
      : null;
    const type = item.media_type === "tv" ? "TV" : "Movie";

    // Escape title for onclick
    const safeItem = JSON.stringify(item).replace(/"/g, '&quot;');

    return `
            <div class="search-result-item" onclick="selectMovie(${safeItem})">
                ${poster
        ? `<img src="${poster}" alt="${title}" />`
        : `<div class="no-poster">🎬</div>`
      }
                <div class="result-info">
                    <span class="result-title">${title}</span>
                    <span class="result-meta">${year} • ${type}</span>
                </div>
            </div>
        `;
  }).join("");

  container.style.display = "block";
}

function selectMovie(movie) {
  selectedMovie = movie;
  displaySelectedMovie(movie);
  const results = document.getElementById("movieSearchResults");
  if (results) results.style.display = "none";
  const input = document.getElementById("movieSearch");
  if (input) input.value = "";
}

async function loadMovieFromURL(id, type) {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`
    );
    const movie = await res.json();
    movie.media_type = type;
    selectedMovie = movie;
    displaySelectedMovie(movie);
  } catch (error) {
    console.error("Error loading movie:", error);
  }
}

function displaySelectedMovie(movie) {
  const container = document.getElementById("selectedMovieContainer"); // Fixed ID mismatch if any, assuming html uses 'selectedMovieCard'
  // Actually html uses id="selectedMovieCard"
  const realContainer = document.getElementById("selectedMovieCard");

  if (!realContainer) return;

  const title = movie.title || movie.name;
  const year = (movie.release_date || movie.first_air_date || "")?.split("-")[0] || "";
  const poster = movie.poster_path
    ? `${TMDB_IMG}${movie.poster_path}`
    : null;
  const overview = movie.overview?.substring(0, 150) || "No description available";

  realContainer.innerHTML = `
        <div class="selected-movie">
            ${poster
      ? `<img src="${poster}" alt="${title}" class="selected-poster" />`
      : `<div class="no-poster-large">🎬</div>`
    }
            <div class="selected-info">
                <h3>${title} <span class="year">(${year})</span></h3>
                <p class="selected-type">${movie.media_type === 'tv' ? 'TV Series' : 'Movie'}</p>
                <button class="change-btn" onclick="clearSelection()">Change Selection</button>
            </div>
        </div>
    `;
  realContainer.style.display = "block";
}

function clearSelection() {
  selectedMovie = null;
  document.getElementById("selectedMovieCard").style.display = "none";
  document.getElementById("movieSearch").focus();
}

// ========== EMOJI RATING ==========
function setupEmojiRating() {
  const emojis = document.querySelectorAll(".emoji-rating span");
  emojis.forEach((emoji, index) => {
    emoji.addEventListener("click", () => selectRating(index + 1));
  });
}

function selectRating(rating) {
  selectedRating = rating;
  const emojis = document.querySelectorAll(".emoji-rating span");

  emojis.forEach((emoji, index) => {
    // Using 'active' class to match CSS
    if (index < rating) {
      emoji.classList.add("active");
    } else {
      emoji.classList.remove("active");
    }
  });

  const ratingDisplay = document.getElementById("ratingValue");
  if (ratingDisplay) {
    ratingDisplay.textContent = `(${rating}/10)`;
    ratingDisplay.style.color = "var(--gold)";
  }
}

// ========== SAVE LOG ==========
async function saveMovieLog() {
  if (!selectedMovie) {
    alert("Please select a movie first!");
    return;
  }

  if (selectedRating === 0) {
    alert("Please select a rating!");
    return;
  }

  const review = document.getElementById("reviewText")?.value?.trim() || "";
  const language = document.getElementById("languageWatched")?.value?.trim() || "";
  const logTime = document.getElementById("logTime")?.value;

  // datetime-local gives "YYYY-MM-DDTHH:mm" — append seconds for Jackson LocalDateTime parsing
  let watchedAt;
  if (logTime) {
    // Input value is like "2026-02-15T19:45" — append :00 for seconds
    watchedAt = logTime.length === 16 ? logTime + ":00" : logTime;
  } else {
    const now = new Date();
    watchedAt = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + 'T' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
  }

  console.log("Saving log — language:", language, "watchedAt:", watchedAt, "review:", review);

  const logData = {
    tmdbId: selectedMovie.id,
    mediaType: selectedMovie.media_type || "movie",
    title: selectedMovie.title || selectedMovie.name,
    posterPath: selectedMovie.poster_path ? `${TMDB_IMG}${selectedMovie.poster_path}` : null,
    review,
    rating: selectedRating,
    languageWatched: language,
    watchedAt
  };

  // Try backend first
  if (USE_BACKEND) {
    const result = await apiRequest("/logs", {
      method: "POST",
      body: JSON.stringify(logData)
    });

    if (result.success) {
      // Also update local watched list for UI consistency
      const watched = JSON.parse(localStorage.getItem("bmf_watched") || "[]");
      if (!watched.includes(String(selectedMovie.id))) {
        watched.push(String(selectedMovie.id));
        localStorage.setItem("bmf_watched", JSON.stringify(watched));
      }

      alert("Movie logged successfully! 🎬");
      window.location.href = "dashboard.html";
      return;
    } else {
      console.error("Backend save failed:", result.error);
      alert("Backend save failed: " + (result.error || "Unknown error") + ". Saving locally instead.");
    }
  }

  // Fallback to localStorage
  saveLogLocal(logData);
}

function saveLogLocal(logData) {
  const logs = JSON.parse(localStorage.getItem("bmf_movie_logs") || "[]");
  const userId = localStorage.getItem("bmf_user_id");

  logs.push({
    id: Date.now().toString(),
    ...logData,
    userId,
    poster: logData.posterPath,
    type: logData.mediaType,
    movieId: logData.tmdbId,
    createdAt: new Date().toISOString()
  });

  localStorage.setItem("bmf_movie_logs", JSON.stringify(logs));
  alert("Movie logged successfully! 🎬");
  window.location.href = "dashboard.html";
}
