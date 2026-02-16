/* ======================================
   HOME PAGE – TMDB INTEGRATION
   Developed by Satheesh Kumar
====================================== */

// Fetch helper with error handling
async function fetchTMDB(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("TMDB Fetch Error:", err);
    return { results: [] };
  }
}

// Create movie/series card HTML
function createCard(item, type = "movie") {
  const title = item.title || item.name;
  const poster = item.poster_path
    ? `${TMDB_IMG}${item.poster_path}`
    : "https://via.placeholder.com/200x300/020b2d/facc15?text=No+Poster";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
  const year = (item.release_date || item.first_air_date || "").split("-")[0] || "";
  const mediaType = type === "tv" ? "tv" : "movie";

  // Clean text for onclick handlers
  const safeTitle = (title || "").replace(/'/g, "\\'");
  const safePoster = (poster || "").replace(/'/g, "\\'");

  return `
        <div class="card">
            <div class="card-poster" onclick="goToDetails(${item.id}, '${mediaType}')">
                <img src="${poster}" alt="${title}" loading="lazy" />
                <div class="card-rating">
                    <span class="star">★</span> ${rating}
                </div>
            </div>
            <div class="card-actions">
                <button class="icon-btn" onclick="event.stopPropagation(); toggleWatchlist(${item.id}, '${mediaType}', '${safeTitle}', '${safePoster}', this)" title="Add to Watchlist">
                    🔖
                </button>
                <button class="icon-btn" onclick="event.stopPropagation(); toggleFavorite(${item.id}, '${mediaType}', '${safeTitle}', '${safePoster}', this)" title="Add to Favorites">
                    🤍
                </button>
            </div>
            <div class="card-info" onclick="goToDetails(${item.id}, '${mediaType}')">
                <h4 class="card-title">${title}</h4>
                <span class="card-year">${year}</span>
            </div>
        </div>
    `;
}

// Navigate to movie details
function goToDetails(id, type) {
  window.location.href = `movie-details.html?id=${id}&type=${type}`;
}

// Render cards to a container
function renderCards(containerId, items, type = "movie") {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = '<p class="no-data">No data available</p>';
    return;
  }

  container.innerHTML = items.slice(0, 10).map(item => createCard(item, type)).join("");
}

// Loading skeleton
function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = Array(10).fill(`
        <div class="card skeleton">
            <div class="card-poster skeleton-poster"></div>
            <div class="card-info">
                <div class="skeleton-title"></div>
                <div class="skeleton-year"></div>
            </div>
        </div>
    `).join("");
}

// Fetch all trending data
async function loadHomePage() {
  // Show loading skeletons
  ["ww-movies", "ww-series", "in-movies", "in-series", "tollywood"].forEach(showLoading);

  // Worldwide Trending Movies
  const wwMovies = await fetchTMDB(
    `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`
  );
  renderCards("ww-movies", wwMovies.results, "movie");

  // Worldwide Trending Series
  const wwSeries = await fetchTMDB(
    `${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}`
  );
  renderCards("ww-series", wwSeries.results, "tv");

  // India Trending Movies
  const inMovies = await fetchTMDB(
    `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&region=IN&sort_by=popularity.desc&with_original_language=hi|ta|te|ml|kn`
  );
  renderCards("in-movies", inMovies.results, "movie");

  // India Trending Series
  const inSeries = await fetchTMDB(
    `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_origin_country=IN&sort_by=popularity.desc`
  );
  renderCards("in-series", inSeries.results, "tv");

  // Tollywood – Trending Telugu Movies
  const tollywood = await fetchTMDB(
    `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=te&sort_by=popularity.desc`
  );
  renderCards("tollywood", tollywood.results, "movie");
}

// Navigate to details page
function goToDetails(id, mediaType) {
  window.location.href = `movie-details.html?id=${id}&type=${mediaType}`;
}

// Initialize home page
document.addEventListener("DOMContentLoaded", loadHomePage);
