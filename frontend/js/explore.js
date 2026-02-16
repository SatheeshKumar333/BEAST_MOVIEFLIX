/* ======================================
   EXPLORE – GLOBAL FILM INDUSTRIES (WOODS)
   Developed by Satheesh Kumar
====================================== */

// Predefined top actors for each wood (TMDB Person IDs)
const WOOD_ACTORS = {
  // Tollywood - Telugu (Nandamuri actors prioritized!)
  tollywood: [
    { id: 76788, name: "Jr NTR", known_for: "RRR, Devara" },
    { id: 1121931, name: "NTR (N.T. Rama Rao)", known_for: "Legendary Actor" },
    { id: 18897, name: "Balakrishna", known_for: "Akhanda, Veera Simha Reddy" },
    { id: 1136406, name: "Ram Charan", known_for: "RRR, Rangasthalam" },
    { id: 1100851, name: "Prabhas", known_for: "Baahubali, Salaar" },
    { id: 1100864, name: "Allu Arjun", known_for: "Pushpa, Ala Vaikunthapurramuloo" },
    { id: 1100852, name: "Mahesh Babu", known_for: "Pokiri, Srimanthudu" },
    { id: 1620, name: "Chiranjeevi", known_for: "Indra, Sye Raa" },
    { id: 1100866, name: "Vijay Deverakonda", known_for: "Arjun Reddy, Liger" },
    { id: 1372383, name: "Ravi Teja", known_for: "Tiger Nageswara Rao" }
  ],

  // Bollywood - Hindi
  bollywood: [
    { id: 11701, name: "Shah Rukh Khan", known_for: "Pathaan, Jawan" },
    { id: 28782, name: "Salman Khan", known_for: "Tiger 3, Dabangg" },
    { id: 85, name: "Aamir Khan", known_for: "Dangal, 3 Idiots" },
    { id: 2552, name: "Amitabh Bachchan", known_for: "Sholay, Don" },
    { id: 1231, name: "Hrithik Roshan", known_for: "War, Krrish" },
    { id: 30614, name: "Ranveer Singh", known_for: "Padmaavat, Simmba" },
    { id: 31550, name: "Ranbir Kapoor", known_for: "Animal, Brahmastra" },
    { id: 1178341, name: "Deepika Padukone", known_for: "Om Shanti Om, Padmaavat" },
    { id: 1172108, name: "Akshay Kumar", known_for: "Sooryavanshi, Rowdy Rathore" },
    { id: 78749, name: "Ajay Devgn", known_for: "Singham, Drishyam" }
  ],

  // Kollywood - Tamil
  kollywood: [
    { id: 1011991, name: "Rajinikanth", known_for: "Jailer, Kabali" },
    { id: 1100868, name: "Vijay", known_for: "Leo, Varisu" },
    { id: 1100867, name: "Ajith Kumar", known_for: "Thunivu, Valimai" },
    { id: 1100869, name: "Suriya", known_for: "Etharkkum Thunindhavan" },
    { id: 1100870, name: "Dhanush", known_for: "Vaathi, Thiruchitrambalam" },
    { id: 1100871, name: "Vikram", known_for: "Ponniyin Selvan, I" },
    { id: 1100872, name: "Karthi", known_for: "Kaithi, Ponniyin Selvan" },
    { id: 1136408, name: "Kamal Haasan", known_for: "Vikram, Indian" },
    { id: 1100873, name: "Sivakarthikeyan", known_for: "Don, Doctor" },
    { id: 1100874, name: "Jayam Ravi", known_for: "Ponniyin Selvan" }
  ],

  // Mollywood - Malayalam
  mollywood: [
    { id: 1100875, name: "Mohanlal", known_for: "Drishyam, Pulimurugan" },
    { id: 1100876, name: "Mammootty", known_for: "Bramayugam, Nanpakal" },
    { id: 1269282, name: "Fahadh Faasil", known_for: "Aavesham, Malayankunju" },
    { id: 1100877, name: "Dulquer Salmaan", known_for: "King of Kotha" },
    { id: 1100878, name: "Prithviraj", known_for: "Aadujeevitham, Lucifer" },
    { id: 1100879, name: "Tovino Thomas", known_for: "Minnal Murali, 2018" },
    { id: 1100880, name: "Nivin Pauly", known_for: "Premam, Action Hero Biju" },
    { id: 1100881, name: "Asif Ali", known_for: "Thallumaala, Kooman" },
    { id: 1100882, name: "Kunchacko Boban", known_for: "Nna Thaan Case Kodu" },
    { id: 1100883, name: "Suraj Venjaramoodu", known_for: "Android Kunjappan" }
  ],

  // Sandalwood - Kannada
  sandalwood: [
    { id: 1136407, name: "Yash", known_for: "KGF Chapter 2, KGF" },
    { id: 1100884, name: "Sudeep", known_for: "Vikrant Rona" },
    { id: 1100885, name: "Darshan", known_for: "Kranti, Robert" },
    { id: 1100886, name: "Puneeth Rajkumar", known_for: "Yuvarathnaa, James" },
    { id: 1100887, name: "Shiva Rajkumar", known_for: "Jailer, Ghost" },
    { id: 1100888, name: "Rishabh Shetty", known_for: "Kantara" },
    { id: 1100889, name: "Upendra", known_for: "Kabzaa, UI" },
    { id: 1100890, name: "Rakshit Shetty", known_for: "777 Charlie" },
    { id: 1100891, name: "Duniya Vijay", known_for: "Salaga, Bhajarangi 2" },
    { id: 1100892, name: "Ganesh", known_for: "Geetha, Mungaru Male" }
  ],

  // Hollywood - English
  hollywood: [
    { id: 6193, name: "Leonardo DiCaprio", known_for: "Inception, Titanic" },
    { id: 287, name: "Brad Pitt", known_for: "Fight Club, Troy" },
    { id: 31, name: "Tom Hanks", known_for: "Forrest Gump, Cast Away" },
    { id: 2963, name: "Nicolas Cage", known_for: "National Treasure" },
    { id: 500, name: "Tom Cruise", known_for: "Top Gun, Mission Impossible" },
    { id: 73968, name: "Henry Cavill", known_for: "Superman, The Witcher" },
    { id: 17419, name: "Bryan Cranston", known_for: "Breaking Bad" },
    { id: 1892, name: "Matt Damon", known_for: "The Martian, Bourne" },
    { id: 380, name: "Robert Downey Jr.", known_for: "Iron Man, Avengers" },
    { id: 1136406, name: "Dwayne Johnson", known_for: "Jumanji, Fast & Furious" }
  ],

  // Nollywood - Nigerian
  nollywood: [
    { id: 0, name: "Genevieve Nnaji", known_for: "Lionheart" },
    { id: 0, name: "Ramsey Nouah", known_for: "Living in Bondage" },
    { id: 0, name: "Omotola Jalade", known_for: "Last Flight to Abuja" },
    { id: 0, name: "Jim Iyke", known_for: "Last Flight to Abuja" },
    { id: 0, name: "Funke Akindele", known_for: "Jenifa's Diary" },
    { id: 0, name: "Richard Mofe-Damijo", known_for: "Out of Bounds" },
    { id: 0, name: "Mercy Johnson", known_for: "The Maid" },
    { id: 0, name: "Chidi Mokeme", known_for: "76" }
  ],

  // Hallyuwood - Korean
  hallyuwood: [
    { id: 1001657, name: "Lee Min-ho", known_for: "Boys Over Flowers, Pachinko" },
    { id: 1267329, name: "Hyun Bin", known_for: "Crash Landing on You" },
    { id: 1267341, name: "Song Joong-ki", known_for: "Vincenzo, Descendants" },
    { id: 20738, name: "Bong Joon-ho", known_for: "Parasite (Director)" },
    { id: 1267330, name: "Park Seo-joon", known_for: "Itaewon Class" },
    { id: 1267331, name: "Kim Soo-hyun", known_for: "My Love from the Star" },
    { id: 1267332, name: "Ji Chang-wook", known_for: "The K2" },
    { id: 1267333, name: "Lee Jong-suk", known_for: "While You Were Sleeping" }
  ]
};

// Complete Woods configuration with all global film industries
const WOODS_CONFIG = [
  // 🇺🇸 NORTH AMERICA
  {
    id: "hollywood",
    name: "Hollywood",
    emoji: "🎬",
    language: "en",
    country: "US",
    region: "North America",
    description: "The world's largest and most influential film industry based in Los Angeles, California. Home to major studios like Warner Bros, Universal, Disney, and Paramount.",
    origin: "Early 20th century",
    color: "#facc15"
  },

  // 🇮🇳 INDIA (Largest by volume)
  {
    id: "tollywood",
    name: "Tollywood",
    emoji: "🐺",
    language: "te",
    country: "IN",
    region: "India",
    description: "Telugu film industry based in Hyderabad. Known for high-budget action spectacles like RRR, Baahubali, and revolutionary VFX. Home of Nandamuri legacy!",
    origin: "1931 with Bhakta Prahlada",
    color: "#ef4444",
    priority: true
  },
  {
    id: "bollywood",
    name: "Bollywood",
    emoji: "🎭",
    language: "hi",
    country: "IN",
    region: "India",
    description: "Hindi film industry centered in Mumbai. The largest producer of films in India and known worldwide for musical dramas and romantic epics.",
    origin: "1913 with Raja Harishchandra",
    color: "#22d3ee"
  },
  {
    id: "kollywood",
    name: "Kollywood",
    emoji: "🌟",
    language: "ta",
    country: "IN",
    region: "India",
    description: "Tamil film industry based in Chennai. Known for innovative storytelling, technical excellence, and international recognition.",
    origin: "1916 with Keechaka Vadham",
    color: "#a855f7"
  },
  {
    id: "mollywood",
    name: "Mollywood",
    emoji: "🌴",
    language: "ml",
    country: "IN",
    region: "India",
    description: "Malayalam film industry based in Kerala. Acclaimed for realistic, artistic, and experimental cinema with global festival recognition.",
    origin: "1928 with Vigathakumaran",
    color: "#10b981"
  },
  {
    id: "sandalwood",
    name: "Sandalwood",
    emoji: "🏔️",
    language: "kn",
    country: "IN",
    region: "India",
    description: "Kannada film industry based in Bangalore. Known for KGF, Kantara, and socially relevant blockbusters.",
    origin: "1934 with Sati Sulochana",
    color: "#f97316"
  },
  {
    id: "pollywood",
    name: "Pollywood",
    emoji: "🎵",
    language: "pa",
    country: "IN",
    region: "India",
    description: "Punjabi film industry known for comedy films and music-driven movies with vibrant cultural themes.",
    origin: "1936 with Sheela",
    color: "#eab308"
  },
  {
    id: "bhojiwood",
    name: "Bhojiwood",
    emoji: "🎪",
    language: "bh",
    country: "IN",
    region: "India",
    description: "Bhojpuri film industry catering to the Bhojpuri-speaking population across Bihar and UP.",
    origin: "1963 with Ganga Maiyya Tohe Piyari Chadhaibo",
    color: "#84cc16"
  },
  {
    id: "ollywood",
    name: "Ollywood",
    emoji: "🌊",
    language: "or",
    country: "IN",
    region: "India",
    description: "Odia film industry based in Odisha. Known for culturally rich storytelling and Jagannath traditions.",
    origin: "1936 with Sita Bibaha",
    color: "#06b6d4"
  },
  {
    id: "marathi_cinema",
    name: "Marathi Cinema",
    emoji: "🏛️",
    language: "mr",
    country: "IN",
    region: "India",
    description: "Marathi film industry based in Maharashtra. Pioneer of Indian cinema with critical acclaim.",
    origin: "1913 with Raja Harishchandra",
    color: "#8b5cf6"
  },
  {
    id: "gujarati_cinema",
    name: "Gujarati Cinema",
    emoji: "🎡",
    language: "gu",
    country: "IN",
    region: "India",
    description: "Gujarati film industry known for family dramas and comedy films.",
    origin: "1932 with Narsinh Mehta",
    color: "#14b8a6"
  },
  {
    id: "bengali_cinema",
    name: "Bengali Cinema",
    emoji: "📚",
    language: "bn",
    country: "IN",
    region: "India",
    description: "Bengali film industry known for Satyajit Ray's masterpieces and intellectual cinema. Oscar-winning legacy.",
    origin: "1917 with Billwamangal",
    color: "#f43f5e"
  },
  {
    id: "assamese_cinema",
    name: "Assamese Cinema",
    emoji: "🍵",
    language: "as",
    country: "IN",
    region: "India",
    description: "Assamese film industry from Northeast India. Known for naturalistic storytelling.",
    origin: "1935 with Joymoti",
    color: "#65a30d"
  },

  // 🌏 EAST ASIA
  {
    id: "chinawood",
    name: "Chinawood",
    emoji: "🐉",
    language: "zh",
    country: "CN",
    region: "East Asia",
    description: "Chinese film industry. One of the largest and oldest cinema industries with martial arts legacy.",
    origin: "1905 with Dingjun Mountain",
    color: "#dc2626"
  },
  {
    id: "hongkong_cinema",
    name: "Hong Kong Cinema",
    emoji: "🥋",
    language: "zh",
    country: "HK",
    region: "East Asia",
    description: "Known for martial arts, action movies, and influencing Hollywood. Home of Bruce Lee and Jackie Chan.",
    origin: "1909",
    color: "#ea580c"
  },
  {
    id: "japanese_cinema",
    name: "Japanese Cinema",
    emoji: "🎌",
    language: "ja",
    country: "JP",
    region: "East Asia",
    description: "Japanese film industry known for anime, samurai epics, and influential directors like Kurosawa and Miyazaki.",
    origin: "1897",
    color: "#e11d48"
  },
  {
    id: "hallyuwood",
    name: "Hallyuwood",
    emoji: "🇰🇷",
    language: "ko",
    country: "KR",
    region: "East Asia",
    description: "South Korean film industry. Global phenomenon with Parasite's Oscar win and K-drama revolution.",
    origin: "1919 with Righteous Revenge",
    color: "#3b82f6"
  },
  {
    id: "taiwanese_cinema",
    name: "Taiwanese Cinema",
    emoji: "🏯",
    language: "zh",
    country: "TW",
    region: "East Asia",
    description: "Taiwanese film industry known for emotional dramas and Ang Lee's masterpieces.",
    origin: "1901",
    color: "#0ea5e9"
  },

  // 🌏 SOUTHEAST ASIA
  {
    id: "thai_cinema",
    name: "Thai Cinema",
    emoji: "🐘",
    language: "th",
    country: "TH",
    region: "Southeast Asia",
    description: "Thai film industry known for horror films, martial arts, and Tony Jaa action spectacles.",
    origin: "1923",
    color: "#0d9488"
  },
  {
    id: "filipino_cinema",
    name: "Filipino Cinema",
    emoji: "🌺",
    language: "tl",
    country: "PH",
    region: "Southeast Asia",
    description: "Philippine film industry with rich storytelling tradition and festival acclaim.",
    origin: "1912",
    color: "#d946ef"
  },
  {
    id: "indonesian_cinema",
    name: "Indonesian Cinema",
    emoji: "🌋",
    language: "id",
    country: "ID",
    region: "Southeast Asia",
    description: "Indonesian film industry known for The Raid franchise and horror films.",
    origin: "1926",
    color: "#ca8a04"
  },

  // 🌍 MIDDLE EAST
  {
    id: "arab_cinema",
    name: "Arab Cinema",
    emoji: "🏜️",
    language: "ar",
    country: "EG",
    region: "Middle East",
    description: "Arab film industry centered in Egypt. One of the oldest and most prolific in the Arab world.",
    origin: "1896",
    color: "#b45309"
  },
  {
    id: "iranian_cinema",
    name: "Iranian Cinema",
    emoji: "🎨",
    language: "fa",
    country: "IR",
    region: "Middle East",
    description: "Iranian film industry acclaimed globally for artistic storytelling. Multiple Oscar wins.",
    origin: "1930",
    color: "#047857"
  },
  {
    id: "turkish_cinema",
    name: "Turkish Cinema",
    emoji: "🕌",
    language: "tr",
    country: "TR",
    region: "Middle East",
    description: "Turkish film industry (Yeşilçam) known for historical dramas and TV series global reach.",
    origin: "1914",
    color: "#be185d"
  },

  // 🌍 EUROPE
  {
    id: "britwood",
    name: "Britwood",
    emoji: "🎩",
    language: "en",
    country: "GB",
    region: "Europe",
    description: "British film industry known for James Bond, Harry Potter, and period dramas.",
    origin: "1895",
    color: "#1d4ed8"
  },
  {
    id: "french_cinema",
    name: "French Cinema",
    emoji: "🗼",
    language: "fr",
    country: "FR",
    region: "Europe",
    description: "French film industry - birthplace of cinema. Known for art films and Cannes Film Festival.",
    origin: "1895 with Lumière brothers",
    color: "#7c3aed"
  },
  {
    id: "german_cinema",
    name: "German Cinema",
    emoji: "🏰",
    language: "de",
    country: "DE",
    region: "Europe",
    description: "German film industry known for expressionism, war films, and technical innovation.",
    origin: "1895",
    color: "#374151"
  },
  {
    id: "italian_cinema",
    name: "Italian Cinema",
    emoji: "🎭",
    language: "it",
    country: "IT",
    region: "Europe",
    description: "Italian film industry known for neorealism, spaghetti westerns, and Fellini masterpieces.",
    origin: "1896",
    color: "#15803d"
  },
  {
    id: "spanish_cinema",
    name: "Spanish Cinema",
    emoji: "💃",
    language: "es",
    country: "ES",
    region: "Europe",
    description: "Spanish film industry known for Pedro Almodóvar and passionate storytelling.",
    origin: "1896",
    color: "#b91c1c"
  },

  // 🌍 AFRICA
  {
    id: "nollywood",
    name: "Nollywood",
    emoji: "🌍",
    language: "en",
    country: "NG",
    region: "Africa",
    description: "Nigerian film industry - second largest by volume globally. Known for prolific output and drama.",
    origin: "1960s",
    color: "#059669"
  },
  {
    id: "south_african_cinema",
    name: "South African Cinema",
    emoji: "🦁",
    language: "en",
    country: "ZA",
    region: "Africa",
    description: "South African film industry known for diverse storytelling and Oscar documentary wins.",
    origin: "1898",
    color: "#ca8a04"
  },

  // 🌍 LATIN AMERICA
  {
    id: "mexican_cinema",
    name: "Mexican Cinema",
    emoji: "🌮",
    language: "es",
    country: "MX",
    region: "Latin America",
    description: "Mexican film industry known for Golden Age classics and modern directors like Cuarón, Iñárritu, del Toro.",
    origin: "1896",
    color: "#16a34a"
  },
  {
    id: "brazilian_cinema",
    name: "Brazilian Cinema",
    emoji: "☀️",
    language: "pt",
    country: "BR",
    region: "Latin America",
    description: "Brazilian film industry known for City of God and diverse cultural representation.",
    origin: "1898",
    color: "#eab308"
  },
  {
    id: "argentine_cinema",
    name: "Argentine Cinema",
    emoji: "🎬",
    language: "es",
    country: "AR",
    region: "Latin America",
    description: "Argentine film industry with Oscar-winning films and strong artistic tradition.",
    origin: "1896",
    color: "#0891b2"
  }
];

let currentWood = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  renderWoodsGrid();
});

// Render woods grid grouped by region
function renderWoodsGrid() {
  const container = document.getElementById("woodsGrid");
  if (!container) return;

  // Group woods by region
  const regions = {};
  WOODS_CONFIG.forEach(wood => {
    if (!regions[wood.region]) regions[wood.region] = [];
    regions[wood.region].push(wood);
  });

  let html = "";

  // Region order
  const regionOrder = [
    "India",
    "North America",
    "East Asia",
    "Southeast Asia",
    "Middle East",
    "Europe",
    "Africa",
    "Latin America"
  ];

  regionOrder.forEach(region => {
    if (regions[region]) {
      html += `
                <div class="region-section">
                    <h2 class="region-title">${getRegionEmoji(region)} ${region}</h2>
                    <div class="region-woods">
                        ${regions[region].map(wood => `
                            <div class="wood-card ${wood.priority ? 'highlight' : ''}" 
                                 onclick="openWoodDetails('${wood.id}')"
                                 style="--wood-color: ${wood.color}">
                                <span class="wood-emoji">${wood.emoji}</span>
                                <h3>${wood.name}</h3>
                                <p class="wood-desc">${wood.description.substring(0, 60)}...</p>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
    }
  });

  container.innerHTML = html;
}

function getRegionEmoji(region) {
  const emojis = {
    "India": "🇮🇳",
    "North America": "🇺🇸",
    "East Asia": "🌏",
    "Southeast Asia": "🌴",
    "Middle East": "🕌",
    "Europe": "🏰",
    "Africa": "🌍",
    "Latin America": "🌎"
  };
  return emojis[region] || "🎬";
}

// Open wood details
async function openWoodDetails(woodId) {
  const wood = WOODS_CONFIG.find(w => w.id === woodId);
  if (!wood) return;

  currentWood = wood;

  // Show details view
  document.getElementById("woodsGridSection").style.display = "none";
  document.getElementById("woodDetailsSection").style.display = "block";

  // Render wood header
  document.getElementById("woodDetailsHeader").innerHTML = `
        <button class="back-btn" onclick="closeWoodDetails()">← Back to Woods</button>
        <div class="wood-header" style="--wood-color: ${wood.color}">
            <span class="wood-emoji-large">${wood.emoji}</span>
            <div class="wood-header-info">
                <h1>${wood.name}</h1>
                <p>${wood.description}</p>
                <div class="wood-meta">
                    <span>🎬 Origin: ${wood.origin}</span>
                    <span>🌍 Region: ${wood.region}</span>
                </div>
            </div>
        </div>
    `;

  // Load movies and actors
  loadWoodMovies(wood);
}

// Load movies for a wood
async function loadWoodMovies(wood) {
  const container = document.getElementById("woodMoviesContainer");

  // Show loading
  container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading ${wood.name} movies...</p>
        </div>
    `;

  try {
    // Build query based on wood
    let discoverUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&page=1`;

    if (wood.language) {
      discoverUrl += `&with_original_language=${wood.language}`;
    }
    if (wood.country && wood.country !== "US" && wood.country !== "GB") {
      discoverUrl += `&with_origin_country=${wood.country}`;
    }

    // Fetch popular movies
    const popularRes = await fetch(discoverUrl);
    const popularData = await popularRes.json();

    // Fetch top rated
    let ratedUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=vote_average.desc&vote_count.gte=50&page=1`;
    if (wood.language) ratedUrl += `&with_original_language=${wood.language}`;

    const ratedRes = await fetch(ratedUrl);
    const ratedData = await ratedRes.json();

    const popularMovies = popularData.results?.slice(0, 20) || [];
    const topRatedMovies = ratedData.results?.slice(0, 20) || [];

    container.innerHTML = `
            <div class="movies-section">
                <h2>🔥 Trending in ${wood.name}</h2>
                <div class="movies-row">
                    ${popularMovies.length > 0 ? popularMovies.map(m => createMovieCard(m)).join("") : "<p>No movies found</p>"}
                </div>
            </div>

            <div class="movies-section">
                <h2>⭐ Top Rated in ${wood.name}</h2>
                <div class="movies-row">
                    ${topRatedMovies.length > 0 ? topRatedMovies.map(m => createMovieCard(m)).join("") : "<p>No movies found</p>"}
                </div>
            </div>
        `;

    // Load actors
    loadWoodActors(wood);
  } catch (err) {
    console.error("Error loading wood movies:", err);
    container.innerHTML = `<div class="error">Failed to load movies. Please try again.</div>`;
  }
}

// Load top actors for a wood - uses predefined list if available
async function loadWoodActors(wood) {
  const container = document.getElementById("woodActorsContainer");
  if (!container) return;

  // Check if we have predefined actors for this wood
  const predefinedActors = WOOD_ACTORS[wood.id];

  if (predefinedActors && predefinedActors.length > 0) {
    // Show loading state
    container.innerHTML = `
            <h2>🌟 Top Stars of ${wood.name}</h2>
            <div class="actors-row loading-actors">
                <div class="loading"><div class="spinner"></div><p>Loading actors...</p></div>
            </div>
        `;

    // Fetch actual photos from TMDB for each actor
    const actorsWithPhotos = await Promise.all(
      predefinedActors.map(async (actor) => {
        try {
          const searchRes = await fetch(
            `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(actor.name)}`
          );
          const searchData = await searchRes.json();

          if (searchData.results && searchData.results.length > 0) {
            const tmdbActor = searchData.results[0];
            return {
              ...actor,
              id: tmdbActor.id,
              profile_path: tmdbActor.profile_path
            };
          }
        } catch (err) {
          console.log(`Could not fetch photo for ${actor.name}`);
        }
        return actor;
      })
    );

    container.innerHTML = `
            <h2>🌟 Top Stars of ${wood.name}</h2>
            <div class="actors-row">
                ${actorsWithPhotos.map(a => createPredefinedActorCard(a)).join("")}
            </div>
        `;
    return;
  }

  // Fallback: Try to fetch from TMDB
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/person/popular?api_key=${TMDB_API_KEY}&page=1`
    );
    const data = await res.json();

    // Filter actors by language
    const actors = data.results?.filter(p =>
      p.known_for?.some(k => k.original_language === wood.language)
    ).slice(0, 10) || [];

    if (actors.length > 0) {
      container.innerHTML = `
                <h2>🌟 Top Stars of ${wood.name}</h2>
                <div class="actors-row">
                    ${actors.map(a => createActorCard(a)).join("")}
                </div>
            `;
    } else {
      container.innerHTML = `
                <h2>🌟 Stars of ${wood.name}</h2>
                <p class="no-data">Actor data coming soon for ${wood.name}!</p>
            `;
    }
  } catch (err) {
    console.error("Error loading actors:", err);
  }
}

// Create movie card
function createMovieCard(movie) {
  const poster = movie.poster_path
    ? `${TMDB_IMG}${movie.poster_path}`
    : "https://via.placeholder.com/200x300/020b2d/facc15?text=No+Poster";
  const rating = movie.vote_average?.toFixed(1) || "N/A";
  const year = movie.release_date?.split("-")[0] || "";

  return `
        <div class="explore-card" onclick="goToDetails(${movie.id}, 'movie')">
            <div class="explore-card-poster">
                <img src="${poster}" alt="${movie.title}" loading="lazy" />
                <div class="explore-card-rating">★ ${rating}</div>
            </div>
            <div class="explore-card-info">
                <h4>${movie.title}</h4>
                <span>${year}</span>
            </div>
        </div>
    `;
}

// Create actor card from TMDB data
function createActorCard(actor) {
  const photo = actor.profile_path
    ? `${TMDB_IMG_W185}${actor.profile_path}`
    : "https://via.placeholder.com/185x278/020b2d/facc15?text=No+Photo";

  return `
        <div class="actor-card" onclick="searchActorMovies('${actor.name}')">
            <img src="${photo}" alt="${actor.name}" loading="lazy" />
            <h4>${actor.name}</h4>
            <span>${actor.known_for_department || "Acting"}</span>
        </div>
    `;
}

// Create actor card from predefined data (with photo if available)
function createPredefinedActorCard(actor) {
  const hasPhoto = actor.profile_path;
  const photo = hasPhoto
    ? `${TMDB_IMG_W185}${actor.profile_path}`
    : null;
  const safeName = actor.name.replace(/'/g, "\\'");

  return `
        <div class="actor-card" onclick="searchActorById(${actor.id}, '${safeName}')">
            ${hasPhoto
      ? `<img src="${photo}" alt="${actor.name}" loading="lazy" />`
      : `<div class="actor-avatar"><span>${actor.name.charAt(0)}</span></div>`
    }
            <h4>${actor.name}</h4>
            <span>${actor.known_for}</span>
        </div>
    `;
}

// Search actor movies by ID
function searchActorById(actorId, actorName) {
  if (actorId && actorId > 0) {
    window.location.href = `movie-details.html?actor=${actorId}&name=${encodeURIComponent(actorName)}`;
  } else {
    // Search by name if no ID
    alert(`Showing movies of ${actorName} - Feature coming soon!`);
  }
}

// Navigate to movie details
function goToDetails(id, type) {
  window.location.href = `movie-details.html?id=${id}&type=${type}`;
}

// Search actor movies
function searchActorMovies(actorName) {
  alert(`Showing movies of ${actorName} - Feature coming soon!`);
}

// Close wood details
function closeWoodDetails() {
  document.getElementById("woodsGridSection").style.display = "block";
  document.getElementById("woodDetailsSection").style.display = "none";
  currentWood = null;
}
