/* ======================================
   MOVIE DETAILS – TMDB INTEGRATION
   Developed by Satheesh Kumar
====================================== */

// Get movie ID and type from URL
// Get movie ID and type from URL
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");
const mediaType = params.get("type") || "movie";
const actorId = params.get("actor");

// Fetch helper
async function fetchTMDB(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("TMDB Fetch Error:", err);
    return null;
  }
}

// Format runtime
function formatRuntime(minutes) {
  if (!minutes) return "N/A";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

// Format currency
function formatMoney(amount) {
  if (!amount) return "N/A";
  return "$" + amount.toLocaleString();
}

// Create cast card
function createCastCard(person) {
  const photo = person.profile_path
    ? `${TMDB_IMG_W185}${person.profile_path}`
    : "https://via.placeholder.com/185x278/020b2d/facc15?text=No+Photo";

  return `
        <div class="cast-card" onclick="window.location.href='movie-details.html?actor=${person.id}'" style="cursor: pointer;">
            <img src="${photo}" alt="${person.name}" loading="lazy" />
            <div class="cast-info">
                <h4>${person.name}</h4>
                <span>${person.character || person.job || ""}</span>
            </div>
        </div>
    `;
}

// Load Content (Movie/TV or Actor)
async function loadContent() {
  if (actorId) {
    await loadActorDetails();
  } else if (movieId) {
    await loadDetails();
  } else {
    showError("No content selected");
  }
}

// Load Actor Details
async function loadActorDetails() {
  const hero = document.querySelector(".movie-hero");
  hero.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading actor details...</p>
        </div>
    `;

  try {
    const details = await fetchTMDB(`${TMDB_BASE_URL}/person/${actorId}?api_key=${TMDB_API_KEY}&append_to_response=combined_credits,external_ids`);

    if (!details || !details.name) {
      showError("Actor details could not be retrieved.");
      return;
    }

    document.title = `${details.name} - Beast MovieFlix`;

    const photo = details.profile_path
      ? `${TMDB_IMG_H632}${details.profile_path}`
      : "https://via.placeholder.com/300x450/020b2d/facc15?text=No+Photo";

    // Sort credits by popularity
    const credits = details.combined_credits?.cast?.sort((a, b) => b.vote_count - a.vote_count) || [];
    const knownFor = credits.slice(0, 10);

    hero.innerHTML = `
            <div class="actor-header-content">
                <div class="poster actor-poster">
                    <img src="${photo}" alt="${details.name}" />
                </div>
                <div class="info">
                    <h1>${details.name}</h1>
                    <div class="meta-row">
                        <span>${details.birthday || "N/A"}</span>
                        ${details.deathday ? `<span class="meta-divider">•</span><span>Died: ${details.deathday}</span>` : ""}
                        <span class="meta-divider">•</span>
                        <span>${details.place_of_birth || "Unknown"}</span>
                    </div>

                    <div class="plot">
                        <h3>Biography</h3>
                        <p>${details.biography || "No biography available."}</p>
                    </div>

                    <div class="details-grid">
                        <div class="detail-item">
                            <span class="label">Known For</span>
                            <span class="value">${details.known_for_department || "Acting"}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Gender</span>
                            <span class="value">${details.gender === 1 ? "Female" : details.gender === 2 ? "Male" : "Not specified"}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Known Credits</span>
                            <span class="value">${credits.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Render Known For
    const sections = document.querySelector(".movie-sections");
    if (sections) {
      let html = "";

      if (knownFor.length > 0) {
        html += `
                    <div class="section-block">
                        <h2>🎬 Known For</h2>
                        <div class="cast-row">
                            ${knownFor.map(item => {
          const poster = item.poster_path ? `${TMDB_IMG_W185}${item.poster_path}` : "https://via.placeholder.com/185x278/1f2937/fbbf24?text=No+Img";
          const title = item.title || item.name;
          const type = item.media_type === 'tv' ? 'TV' : 'Movie';
          // Fix: Pass correct ID and Type to onclick
          return `
                                    <div class="cast-card" onclick="window.location.href='movie-details.html?id=${item.id}&type=${item.media_type || 'movie'}'" style="cursor: pointer;">
                                        <img src="${poster}" alt="${title}" loading="lazy" />
                                        <div class="cast-info">
                                            <h4>${title}</h4>
                                            <span class="character">${item.character ? `as ${item.character}` : type}</span>
                                        </div>
                                    </div>
                                `;
        }).join("")}
                        </div>
                    </div>
                `;
      }

      sections.innerHTML = html;
    }
  } catch (error) {
    console.error("Error loading actor details:", error);
    showError("Failed to load actor details. Please try again.");
  }
}

function showError(msg) {
  document.querySelector(".movie-hero").innerHTML = `
        <div class="error-message">
            <h1>Error</h1>
            <p>${msg}</p>
            <a href="home.html" class="btn primary">Go Home</a>
        </div>
    `;
}

// Load movie/series details
async function loadDetails() {
  // Show loading
  document.querySelector(".movie-hero").innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading movie details...</p>
        </div>
    `;

  // Fetch movie details
  const details = await fetchTMDB(
    `${TMDB_BASE_URL}/${mediaType}/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,reviews,videos`
  );

  if (!details) {
    showError("Movie not found");
    return;
  }

  // Update page title
  document.title = `${details.title || details.name} | Beast MovieFlix`;

  // Get backdrop and poster
  const backdrop = details.backdrop_path
    ? `${TMDB_IMG_ORIGINAL}${details.backdrop_path}`
    : "";
  const poster = details.poster_path
    ? `${TMDB_IMG}${details.poster_path}`
    : "https://via.placeholder.com/500x750/020b2d/facc15?text=No+Poster";

  // Get genres
  const genres = details.genres?.map(g => g.name).join(", ") || "N/A";

  // Get rating
  const rating = details.vote_average ? details.vote_average.toFixed(1) : "N/A";
  const voteCount = details.vote_count || 0;

  // Get runtime/episodes
  const runtime = mediaType === "movie"
    ? formatRuntime(details.runtime)
    : `${details.number_of_seasons || 0} Seasons, ${details.number_of_episodes || 0} Episodes`;

  // Get release date
  const releaseDate = details.release_date || details.first_air_date || "N/A";
  const year = releaseDate !== "N/A" ? releaseDate.split("-")[0] : "";

  // Get languages
  const originalLang = details.original_language?.toUpperCase() || "N/A";
  const spokenLangs = details.spoken_languages?.map(l => l.english_name).join(", ") || "N/A";

  // Get production companies
  const companies = details.production_companies?.map(c => c.name).join(", ") || "N/A";

  // Render hero section
  document.querySelector(".movie-hero").innerHTML = `
        ${backdrop ? `<div class="backdrop" style="background-image: url('${backdrop}')"></div>` : ""}
        <div class="hero-overlay"></div>
        <div class="hero-content">
            <div class="poster">
                <img src="${poster}" alt="${details.title || details.name}" />
                ${isLoggedIn() ? `
                    <div class="action-buttons" style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
                        <button class="btn primary log-btn" onclick="logThisMovie()" style="width: 100%;">
                            ✍️ Log This ${mediaType === "tv" ? "Series" : "Movie"}
                        </button>
                        <button id="watchlistBtn" class="btn secondary" onclick="toggleWatchlistDetails()" style="width: 100%;">
                            🔖 Watchlist
                        </button>
                        <button id="favoriteBtn" class="btn secondary" onclick="toggleFavoriteDetails()" style="width: 100%;">
                            ❤️ Favorite
                        </button>
                    </div>
                ` : ""}
            </div>
            <div class="info">
                <h1>${details.title || details.name}</h1>
                ${details.tagline ? `<p class="tagline">"${details.tagline}"</p>` : ""}
                
                <!-- Movie Status Indicators -->
                <div class="movie-status-indicators" id="movieStatusIndicators"></div>
                
                <div class="meta-row">
                    <span class="rating"><span class="star">★</span> ${rating}</span>
                    <span class="meta-divider">•</span>
                    <span>${year}</span>
                    <span class="meta-divider">•</span>
                    <span>${runtime}</span>
                    <span class="meta-divider">•</span>
                    <span class="lang">${originalLang}</span>
                </div>

                <div class="genres">
                    ${details.genres?.map(g => `<span class="genre-tag">${g.name}</span>`).join("") || ""}
                </div>

                <div class="plot">
                    <h3>Overview</h3>
                    <p>${details.overview || "No overview available."}</p>
                </div>

                <div class="details-grid">
                    <div class="detail-item">
                        <span class="label">Status</span>
                        <span class="value">${details.status || "N/A"}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Original Language</span>
                        <span class="value">${originalLang}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Spoken Languages</span>
                        <span class="value">${spokenLangs}</span>
                    </div>
                    ${mediaType === "movie" ? `
                        <div class="detail-item">
                            <span class="label">Budget</span>
                            <span class="value">${formatMoney(details.budget)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Revenue</span>
                            <span class="value">${formatMoney(details.revenue)}</span>
                        </div>
                    ` : ""}
                </div>
            </div>
        </div>
    `;

  if (isLoggedIn()) {
    // Display status indicators showing if movie is logged/favorited/watchlisted
    displayMovieStatus(movieId, mediaType);
  }

  // Render cast
  const cast = details.credits?.cast?.slice(0, 12) || [];
  if (cast.length > 0) {
    document.getElementById("cast-container").innerHTML = `
            <h2>🎭 Cast</h2>
            <div class="cast-row">
                ${cast.map(person => `
                    <div class="cast-card" onclick="window.location.href='movie-details.html?actor=${person.id}'" style="cursor: pointer;">
                        <img src="${person.profile_path ? TMDB_IMG_W185 + person.profile_path : 'https://via.placeholder.com/185x278/020b2d/facc15?text=No+Photo'}" alt="${person.name}" loading="lazy" />
                        <div class="cast-info">
                            <h4>${person.name}</h4>
                            <span>${person.character}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
  }

  // Render crew (director, writer, producer)
  const keyJobs = ["Director", "Writer", "Screenplay", "Producer", "Executive Producer"];
  const crew = details.credits?.crew?.filter(c => keyJobs.includes(c.job)).slice(0, 8) || [];
  if (crew.length > 0) {
    document.getElementById("crew-container").innerHTML = `
            <h2>🎬 Crew</h2>
            <div class="cast-row">
                ${crew.map(createCastCard).join("")}
            </div>
        `;
  }

  // Render reviews
  const reviews = details.reviews?.results?.slice(0, 5) || [];
  if (reviews.length > 0) {
    document.getElementById("reviews-container").innerHTML = `
            <h2>📝 Reviews</h2>
            <div class="reviews-list">
                ${reviews.map(r => `
                    <div class="review-card">
                        <div class="review-header">
                            <span class="reviewer">${r.author}</span>
                            ${r.author_details?.rating ? `<span class="review-rating">★ ${r.author_details.rating}/10</span>` : ""}
                        </div>
                        <p class="review-content">${r.content.substring(0, 500)}${r.content.length > 500 ? "..." : ""}</p>
                    </div>
                `).join("")}
            </div>
        `;
  }

  // Render trailer
  const trailer = details.videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
  if (trailer) {
    document.getElementById("trailer-container").innerHTML = `
            <h2>🎥 Trailer</h2>
            <div class="trailer-wrapper">
                <iframe 
                    src="https://www.youtube.com/embed/${trailer.key}" 
                    frameborder="0" 
                    allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                </iframe>
            </div>
        `;
  }
}

// ========== ACTIONS ==========

// ========== ACTIONS ==========

function updateActionButtons() {
  const wBtn = document.getElementById("watchlistBtn");
  const fBtn = document.getElementById("favoriteBtn");

  if (wBtn) {
    const isWatched = isInList("watchlist", movieId);
    updateBtnState(wBtn, isWatched, "watchlist");
  }

  if (fBtn) {
    const isFav = isInList("favorites", movieId);
    updateBtnState(fBtn, isFav, "favorite");
  }
}

// Expose these globally or attach to window if needed, but since actions.js is loaded,
// we can directly use toggleWatchlist and toggleFavorite from actions.js in the HTML onclick.
// However, the HTML calls these without arguments (relying on global variables or closure).
// We need to bridge them.

window.toggleWatchlistDetails = function () {
  const title = document.querySelector("h1")?.textContent || "Unknown Title";
  const posterImg = document.querySelector(".poster img");
  const posterPath = posterImg ? posterImg.src : "";
  const btn = document.getElementById("watchlistBtn");

  toggleWatchlist(movieId, mediaType, title, posterPath, btn);
};

window.toggleFavoriteDetails = function () {
  const title = document.querySelector("h1")?.textContent || "Unknown Title";
  const posterImg = document.querySelector(".poster img");
  const posterPath = posterImg ? posterImg.src : "";
  const btn = document.getElementById("favoriteBtn");

  toggleFavorite(movieId, mediaType, title, posterPath, btn);
};

// Log this movie (Add to Diary/Watched)
function logThisMovie() {
  const userId = localStorage.getItem("bmf_user_id");
  if (!userId) {
    alert("Please login to log movies!");
    return;
  }

  const title = document.querySelector(".info h1")?.textContent || "Unknown Title";
  const posterImg = document.querySelector(".poster img");
  const posterPath = posterImg ? posterImg.src : "";

  // Add to diary/watched list in localStorage
  let diary = JSON.parse(localStorage.getItem("bmf_diary") || "[]");

  // Check if already logged
  const exists = diary.some(m => m.id == movieId && m.userId === userId);
  if (exists) {
    alert("This movie is already in your diary!");
    return;
  }

  const rating = prompt("Rate this movie (1-10):", "8");
  const review = prompt("Add a short review (optional):", "");

  diary.push({
    id: movieId,
    userId: userId,
    type: mediaType,
    title: title,
    poster: posterPath,
    rating: rating || "8",
    review: review || "",
    watchedAt: new Date().toISOString()
  });

  localStorage.setItem("bmf_diary", JSON.stringify(diary));
  updateWatchlistFavoriteButtons();
}

// Display movie status indicators
async function displayMovieStatus(movieId, mediaType) {
  const userId = localStorage.getItem('bmf_user_id');
  if (!userId) return; // Guest users don't have statuses

  const statusContainer = document.getElementById('movieStatusIndicators');
  if (!statusContainer) return;

  const statuses = [];

  // Check if logged — try backend first
  let userLog = null;
  if (typeof USE_BACKEND !== 'undefined' && USE_BACKEND) {
    try {
      const result = await apiRequest("/logs");
      if (result.success && Array.isArray(result.data)) {
        userLog = result.data.find(log => log.tmdbId == movieId);
      }
    } catch (e) {
      console.log("Backend unavailable for log check");
    }
  }

  // Fallback to localStorage for log check
  if (!userLog) {
    const logs = JSON.parse(localStorage.getItem('bmf_diary') || '[]');
    const oldLogs = JSON.parse(localStorage.getItem('bmf_movie_logs') || '[]');
    const allLogs = [...logs, ...oldLogs];
    userLog = allLogs.find(log =>
      log.userId === userId &&
      (log.tmdbId == movieId || log.movieId == movieId || log.id == movieId)
    );
  }

  if (userLog) {
    const logDate = new Date(userLog.watchedAt || userLog.createdAt);
    const formattedDate = logDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = logDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const rating = userLog.rating ? `⭐ ${userLog.rating}/10` : '';

    statuses.push(`
      <div class="status-badge logged">
        ✅ You logged this on ${formattedDate} at ${formattedTime} ${rating}
      </div>
    `);
  }

  // Check favorites & watchlist — try backend first
  let inFavorites = false;
  let inWatchlist = false;

  if (typeof USE_BACKEND !== 'undefined' && USE_BACKEND) {
    try {
      const checkResult = await apiRequest(`/media/check/${movieId}?mediaType=${mediaType || 'movie'}`);
      if (checkResult.success && checkResult.data) {
        inFavorites = checkResult.data.inFavorites || false;
        inWatchlist = checkResult.data.inWatchlist || false;
      }
    } catch (e) {
      console.log("Backend unavailable for status check");
    }
  }

  // Fallback to localStorage
  if (!inFavorites) {
    const favorites = JSON.parse(localStorage.getItem('bmf_favorites') || '[]');
    inFavorites = favorites.some(fav => fav.userId === userId && fav.id == movieId);
  }
  if (!inWatchlist) {
    const watchlist = JSON.parse(localStorage.getItem('bmf_watchlist') || '[]');
    inWatchlist = watchlist.some(item => item.userId === userId && item.id == movieId);
  }

  if (inFavorites) {
    statuses.push(`
      <div class="status-badge favorite">
        ❤️ This is in your favorites
      </div>
    `);
  }

  if (inWatchlist) {
    statuses.push(`
      <div class="status-badge watchlist">
        📋 This is in your watchlist
      </div>
    `);
  }

  statusContainer.innerHTML = statuses.join('');
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  loadContent();
});
