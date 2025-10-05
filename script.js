const categories = {
    home: [
        "sports",
        "tv",
        "movies",
        "cartoons",
        "anime",
        "sportstelevision"
    ],
    sports: "sports",
    tv: "television_inbox",
    movies: "moviesandfilms",
    cartoons: ["animation_unsorted", "more_animation"],
    anime: ["anime", "anime_miscellaneous"],
    sportstelevision: "sportstelevision"
};

// Category descriptions for AdSense
const categoryDescriptions = {
    sports: "Explore a curated collection of sports videos, including classic matches, highlights, and documentaries. All videos open on Archive.org for safe viewing.",
    sportstelevision: "Watch sports television programs, live recordings, and special coverage from Archive.org. Enjoy curated content for sports enthusiasts.",
    tv: "Browse a selection of television shows and episodes from Archive.org. All content is publicly accessible and organized for easy viewing.",
    movies: "Discover classic and modern movies from Archive.org. This section highlights popular films and hidden gems for movie lovers.",
    cartoons: "Enjoy animated cartoons and short films sourced from Archive.org. Perfect for kids, fans of animation, or nostalgic viewing.",
    anime: "Explore a curated collection of anime videos from Archive.org. Watch episodes, shorts, and classics safely in new tabs."
};

let currentCategory = "home";
const trendingSection = document.getElementById("trending");
const homeSection = document.getElementById("home-videos");
const categorySection = document.getElementById("category-videos");

// Create video card
function createVideoCard(video) {
    const card = document.createElement("div");
    card.className = "video-card";

    card.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}">
        <h4>${video.title}</h4>
        <button class="stream-btn">▶ Stream</button>
    `;

    const btn = card.querySelector(".stream-btn");
    btn.addEventListener("click", () => {
        if(video.rights && (video.rights.toLowerCase().includes("public domain") || video.rights.toLowerCase().includes("creative commons"))){
            const identifier = video.url.split('/').pop();
            card.innerHTML = `
                <video controls width="100%" autoplay poster="${video.thumbnail}">
                    <source src="https://archive.org/download/${identifier}/${identifier}.mp4" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <h4>${video.title}</h4>
            `;
        } else {
            window.open(video.url, "_blank");
        }
    });

    return card;
}

// Fetch videos
async function fetchVideos(identifier, limit=4, page=1) {
    const url = `https://archive.org/advancedsearch.php?q=collection:${identifier}&fl[]=identifier,title,downloads,mediatype,rights&rows=${limit}&page=${page}&output=json`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if(!data.response.docs) return [];

        return data.response.docs.map(item => ({
            title: item.title,
            thumbnail: `https://archive.org/services/get-item-image.php?identifier=${item.identifier}&mediatype=movies&thumb=1`,
            url: `https://archive.org/details/${item.identifier}`,
            rights: item.rights || "Unknown"
        }));
    } catch (e) {
        console.error("Error fetching videos:", e);
        return [];
    }
}

// Trending
async function showTrending() {
    trendingSection.innerHTML = "";
    try {
        const trendingVideos = await fetchVideos(categories.home[0], 6);
        trendingVideos.forEach(video => trendingSection.appendChild(createVideoCard(video)));
    } catch(err) {
        console.error("Error showing trending videos:", err);
    }
}

// Home videos with descriptions and ads
async function showHome() {
    homeSection.innerHTML = "";

    for (let cat in categories) {
        if(cat === "home") continue;

        let catLinks = categories[cat];
        if(!Array.isArray(catLinks)) catLinks = [catLinks];

        // Header
        const header = document.createElement("h3");
        header.textContent = cat.toUpperCase();
        homeSection.appendChild(header);

        // Category description (safe check)
        if(categoryDescriptions[cat]) {
            const desc = document.createElement("p");
            desc.style.fontSize = "0.9em";
            desc.style.color = "#555";
            desc.textContent = categoryDescriptions[cat];
            homeSection.appendChild(desc);
        }

        const grid = document.createElement("div");
        grid.className = "video-grid";
        homeSection.appendChild(grid);

        let videoCount = 0; // Counter for ad insertion

        for(const link of catLinks){
            try {
                const videos = await fetchVideos(link, 4);
                videos.forEach(v => {
                    grid.appendChild(createVideoCard(v));
                    videoCount++;

                    // Insert AdSense ad every 4 videos
                    if(videoCount % 4 === 0){
                        const ad = document.createElement("ins");
                        ad.className = "adsbygoogle";
                        ad.style.display = "block";
                        ad.setAttribute("data-ad-client", "ca-pub-3798659133542290");
                        ad.setAttribute("data-ad-slot", "9086965876");
                        ad.setAttribute("data-ad-format", "auto");
                        ad.setAttribute("data-full-width-responsive", "true");
                        grid.appendChild(ad);
                        (adsbygoogle = window.adsbygoogle || []).push({});
                    }
                });
            } catch(err) {
                console.error(`Error loading videos for ${link}:`, err);
            }
        }
    }
}

// Category view with infinite scroll and ads
async function showCategory(category) {
    categorySection.innerHTML = "";
    let catLinks = categories[category];
    if(!Array.isArray(catLinks)) catLinks = [catLinks];
    const grid = document.createElement("div");
    grid.className = "video-grid";
    categorySection.appendChild(grid);

    let page = 1;
    let loading = false;
    let videoCount = 0;

    async function loadVideos() {
        if(loading) return;
        loading = true;

        for(const link of catLinks){
            try {
                let videos = await fetchVideos(link, 10, page);

                if(category === "sports") {
                    videos.sort((a, b) => {
                        const yearA = parseInt((a.title.match(/\d{4}/) || [0])[0]);
                        const yearB = parseInt((b.title.match(/\d{4}/) || [0])[0]);
                        if(yearB !== yearA) return yearB - yearA;
                        return a.title.localeCompare(b.title);
                    });
                } else if(category === "sportstelevision") {
                    videos.sort((a, b) => {
                        const titleA = a.title.toLowerCase();
                        const titleB = b.title.toLowerCase();
                        const yearA = parseInt((a.title.match(/\d{4}/) || [0])[0]);
                        const yearB = parseInt((b.title.match(/\d{4}/) || [0])[0]);

                        if(titleA.includes("football") && !titleB.includes("football")) return -1;
                        if(!titleA.includes("football") && titleB.includes("football")) return 1;

                        if(yearB !== yearA) return yearB - yearA;
                        return titleA.localeCompare(titleB);
                    });
                }

                videos.forEach(v => {
                    grid.appendChild(createVideoCard(v));
                    videoCount++;

                    if(videoCount % 4 === 0){
                        const ad = document.createElement("ins");
                        ad.className = "adsbygoogle";
                        ad.style.display = "block";
                        ad.setAttribute("data-ad-client", "ca-pub-3798659133542290");
                        ad.setAttribute("data-ad-slot", "9086965876");
                        ad.setAttribute("data-ad-format", "auto");
                        ad.setAttribute("data-full-width-responsive", "true");
                        grid.appendChild(ad);
                        (adsbygoogle = window.adsbygoogle || []).push({});
                    }
                });
            } catch(err) {
                console.error(`Error loading videos for ${link}:`, err);
            }
        }

        page++;
        loading = false;
    }

    await loadVideos();

    window.onscroll = async () => {
        if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
            await loadVideos();
        }
    }
}

// Nav bar
document.querySelectorAll(".nav-links li").forEach(li => {
    li.addEventListener("click", async () => {
        document.querySelectorAll(".nav-links li").forEach(x => x.classList.remove("active"));
        li.classList.add("active");
        currentCategory = li.dataset.category;
        if(currentCategory === "home"){
            categorySection.innerHTML = "";
            await showHome();
        } else {
            homeSection.innerHTML = "";
            await showCategory(currentCategory);
        }
    });
});

// Search form
document.getElementById("searchForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = document.getElementById("searchInput").value.toLowerCase();
    categorySection.innerHTML = "";

    const loading = document.createElement("p");
    loading.textContent = "Searching...";
    loading.style.textAlign = "center";
    loading.style.fontWeight = "bold";
    categorySection.appendChild(loading);

    const grid = document.createElement("div");
    grid.className = "video-grid";

    try {
        let allVideos = [];

        for (const cat of categories.home) {
            const videos = await fetchVideos(cat, 20);
            allVideos = allVideos.concat(videos);
        }

        const res = await fetch(
            `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,year,rights&sort[]=year+desc&rows=20&page=1&output=json`
        );
        const data = await res.json();
        if(data.response.docs) {
            const archiveVideos = data.response.docs.map(v => ({
                title: v.title,
                url: `https://archive.org/details/${v.identifier}`,
                rights: v.rights || "Unknown",
                thumbnail: `https://archive.org/services/get-item-image.php?identifier=${v.identifier}&mediatype=movies&thumb=1`
            }));
            allVideos = allVideos.concat(archiveVideos);
        }

        const unique = {};
        const filtered = allVideos.filter(v => {
            const key = v.title.toLowerCase().trim();
            if (unique[key]) return false;
            unique[key] = true;