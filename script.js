const categories = {
    home: ["sports","tv","movies","cartoons","anime","sportstelevision"],
    sports: "sports",
    tv: "television_inbox",
    movies: "moviesandfilms",
    cartoons: ["animation_unsorted","more_animation"],
    anime: ["anime","anime_miscellaneous"],
    sportstelevision: "sportstelevision"
};

const categoryDescriptions = {
    sports: "Curated sports videos including classic matches and highlights. All videos open on Archive.org in new tabs.",
    sportstelevision: "Watch sports TV programs, live recordings, and coverage. Content opens externally on Archive.org.",
    tv: "Selection of TV shows and episodes sourced from Archive.org.",
    movies: "Classic and modern movies curated from Archive.org. Watch safely in new tabs.",
    cartoons: "Animated cartoons and short films sourced from Archive.org.",
    anime: "Anime episodes and shorts curated for safe viewing via Archive.org."
};

let currentCategory = "home";
const trendingSection = document.getElementById("trending");
const homeSection = document.getElementById("home-videos");
const categorySection = document.getElementById("category-videos");

function toggleSections(showHome=true){
    homeSection.style.display = showHome?"block":"none";
    trendingSection.style.display = showHome?"block":"none";
    categorySection.style.display = showHome?"none":"block";
}

function extractYear(title){
    const match = title.match(/\b(19|20)\d{2}\b/);
    return match? match[0]:"";
}

function createVideoCard(video){
    const card = document.createElement("div");
    card.className = "video-card";

    const hours = Math.floor(video.duration / 3600);
    const minutes = Math.floor((video.duration % 3600) / 60);
    const durationText = hours>0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    card.innerHTML = `
        <div class="video-thumb-container">
            <img src="${video.thumbnail}" alt="${video.title}" class="video-thumb">
        </div>
        <div class="video-info">
            <h4>${video.title} ${extractYear(video.title) ? `(${extractYear(video.title)})` : ''} - ${durationText}</h4>
        </div>
        <div class="video-details hidden">
            <p class="video-desc">${video.description || "No description available."}</p>
            <button class="stream-btn">Watch</button>
        </div>
    `;

    const thumb = card.querySelector(".video-thumb-container");
    thumb.addEventListener("click", () => {
        const details = card.querySelector(".video-details");
        const currentlyExpanded = document.querySelectorAll(".video-details:not(.hidden)");
        currentlyExpanded.forEach(d => { if(d !== details) d.classList.add("hidden"); });
        details.classList.toggle("hidden");
    });

    card.querySelector(".stream-btn").addEventListener("click", () => {
        const streamWindow = window.open(video.url,"_blank");
        if(streamWindow){
            streamWindow.document.addEventListener("DOMContentLoaded", ()=>{
                streamWindow.document.body.requestFullscreen?.();
            });
        }
    });

    return card;
}

async function fetchVideos(identifier, limit=4, page=1){
    try{
        const res = await fetch(`https://archive.org/advancedsearch.php?q=collection:${identifier}&fl[]=identifier,title,downloads,mediatype,rights,description,runtime&rows=${limit}&page=${page}&output=json`);
        const data = await res.json();
        if(!data.response.docs) return [];

        return data.response.docs.map(item=>{
            let durationSec = 0;
            if(item.runtime){
                const match = item.runtime.match(/(\d+):(\d+):(\d+)/);
                if(match){
                    durationSec = parseInt(match[1])*3600 + parseInt(match[2])*60 + parseInt(match[3]);
                }
            }
            return {
                title: item.title,
                thumbnail: `https://archive.org/services/get-item-image.php?identifier=${item.identifier}&mediatype=movies&thumb=1`,
                url: `https://archive.org/details/${item.identifier}`,
                rights: item.rights || "Unknown",
                description: item.description || "",
                duration: durationSec
            };
        });
    } catch(e){
        console.error("Error fetching videos:", e);
        return [];
    }
}

async function showTrending(){
    trendingSection.innerHTML = "";
    const trendingVideos = await fetchVideos(categories.home[0],6);
    const filteredMovies = trendingVideos.filter(v=> v.duration>=3600);
    filteredMovies.forEach(video=> trendingSection.appendChild(createVideoCard(video)));
}

async function showHome(){
    toggleSections(true);
    homeSection.innerHTML = "";

    for(let cat in categories){
        if(cat==="home") continue;

        let catLinks = categories[cat];
        if(!Array.isArray(catLinks)) catLinks = [catLinks];

        const header = document.createElement("h3");
        header.textContent = cat.toUpperCase();
        homeSection.appendChild(header);

        if(categoryDescriptions[cat]){
            const desc = document.createElement("p");
            desc.style.fontSize="0.9em";
            desc.style.color="#eee";
            desc.textContent = categoryDescriptions[cat];
            homeSection.appendChild(desc);
        }

        const grid = document.createElement("div");
        grid.className="video-grid";
        homeSection.appendChild(grid);

        let videoCount = 0;
        for(const link of catLinks){
            try{
                const videos = await fetchVideos(link,4);
                let filteredVideos = videos;

                if(["movies","tv","anime"].includes(cat)){
                    filteredVideos = videos.filter(v=>{
                        const title = v.title.toLowerCase();
                        return !(
                            title.includes("trailer")||
                            title.includes("teaser")||
                            title.includes("promo")||
                            title.includes("preview")||
                            title.includes("bts")||
                            title.includes("behind the scenes")||
                            title.includes("intro")||
                            title.includes("opening")||
                            title.includes("credits")
                        );
                    });
                    if(cat==="movies") filteredVideos = filteredVideos.filter(v=>v.duration>=3600);
                    filteredVideos.sort((a,b)=>{
                        const yearA=parseInt((a.title.match(/\b(19|20)\d{2}\b/)||[0])[0]);
                        const yearB=parseInt((b.title.match(/\b(19|20)\d{2}\b/)||[0])[0]);
                        if(!yearA && !yearB) return a.title.localeCompare(b.title);
                        if(!yearA) return 1;
                        if(!yearB) return -1;
                        return yearB-yearA;
                    });
                }

                filteredVideos.forEach(v=>{
                    grid.appendChild(createVideoCard(v));
                    videoCount++;
                    if(videoCount%4===0){
                        const ad=document.createElement("ins");
                        ad.className="adsbygoogle";
                        ad.style.display="block";
                        ad.setAttribute("data-ad-client","ca-pub-3798659133542290");
                        ad.setAttribute("data-ad-slot","9086965876");
                        ad.setAttribute("data-ad-format","auto");
                        ad.setAttribute("data-full-width-responsive","true");
                        grid.appendChild(ad);
                        (adsbygoogle=window.adsbygoogle||[]).push({});
                    }
                });
            } catch(err){ console.error(`Error loading ${link}:`,err); }
        }
    }
}

async function showCategory(category){
    toggleSections(false);
    categorySection.innerHTML = "";
    let catLinks = categories[category];
    if(!Array.isArray(catLinks)) catLinks = [catLinks];

    const grid = document.createElement("div");
    grid.className="video-grid";
    categorySection.appendChild(grid);

    let page=1;
    let loading=false;
    let videoCount=0;

    async function loadVideos(){
        if(loading) return;
        loading=true;

        for(const link of catLinks){
            try{
                const videos = await fetchVideos(link,10,page);
                let filteredVideos = videos;

                if(["movies","tv","anime"].includes(category)){
                    filteredVideos = videos.filter(v=>{
                        const title = v.title.toLowerCase();
                        return !(
                            title.includes("trailer")||
                            title.includes("teaser")||
                            title.includes("promo")||
                            title.includes("preview")||
                            title.includes("bts")||
                            title.includes("behind the scenes")||
                            title.includes("intro")||
                            title.includes("opening")||
                            title.includes("credits")
                        );
                    });
                    if(category==="movies") filteredVideos = filteredVideos.filter(v=>v.duration>=3600);
                    filteredVideos.sort((a,b)=>{
                        const yearA=parseInt((a.title.match(/\b(19|20)\d{2}\b/)||[0])[0]);
                        const yearB=parseInt((b.title.match(/\b(19|20)\d{2}\b/)||[0])[0]);
                        if(!yearA && !yearB) return a.title.localeCompare(b.title);
                        if(!yearA) return 1;
                        if(!yearB) return -1;
                        return yearB-yearA;
                    });
                }

                else if(category==="sports"){
                    filteredVideos.sort((a,b)=>{
                        const yearA=parseInt((a.title.match(/\d{4}/)||[0])[0]);
                        const yearB=parseInt((b.title.match(/\d{4}/)||[0])[0]);
                        if(yearB!==yearA) return yearB-yearA;
                        return a.title.localeCompare(b.title);
                    });
                }

                else if(category==="sportstelevision"){
                    filteredVideos.sort((a,b)=>{
                        const titleA=a.title.toLowerCase(), titleB=b.title.toLowerCase();
                        const yearA=parseInt((a.title.match(/\d{4}/)||[0])[0]);
                        const yearB=parseInt((b.title.match(/\d{4}/)||[0])[0]);
                        if(titleA.includes("football") && !titleB.includes("football")) return -1;
                        if(!titleA.includes("football") && titleB.includes("football")) return 1;
                        if(yearB!==yearA) return yearB-yearA;
                        return titleA.localeCompare(titleB);
                    });
                }

                filteredVideos.forEach(v=>{
                    grid.appendChild(createVideoCard(v));
                    videoCount++;
                    if(videoCount%4===0){
                        const ad=document.createElement("ins");
                        ad.className="adsbygoogle";
                        ad.style.display="block";
                        ad.setAttribute("data-ad-client","ca-pub-3798659133542290");
                        ad.setAttribute("data-ad-slot","9086965876");
                        ad.setAttribute("data-ad-format","auto");
                        ad.setAttribute("data-full-width-responsive","true");
                        grid.appendChild(ad);
                        (adsbygoogle=window.adsbygoogle||[]).push({});
                    }
                });
            } catch(err){ console.error(`Error loading ${link}:`,err); }
        }
        page++;
        loading=false;
    }

    await loadVideos();
    window.onscroll = async()=>{
        if(window.innerHeight + window.scrollY >= document.body.offsetHeight-2){
            await loadVideos();
        }
    };
}

// Nav click
document.querySelectorAll(".nav-links li").forEach(li=>{
    li.addEventListener("click", async()=>{
        document.querySelectorAll(".nav-links li").forEach(x=>x.classList.remove("active"));
        li.classList.add("active");
        currentCategory = li.dataset.category;
        if(currentCategory==="home"){
            await showHome();
        } else {
            await showCategory(currentCategory);
        }
    });
});

// Search
document.getElementById("searchForm").addEventListener("submit", async e=>{
    e.preventDefault();
    toggleSections(false);
    const query = document.getElementById("searchInput").value.toLowerCase();
    categorySection.innerHTML="<p style='text-align:center;font-weight:bold'>Searching...</p>";

    const grid=document.createElement("div");
    grid.className="video-grid";

    try{
        let allVideos=[];
        for(const cat of categories.home){
            const videos=await fetchVideos(cat,20);
            allVideos=allVideos.concat(videos);
        }

        const res=await fetch(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,year,rights,description,runtime&sort[]=year+desc&rows=20&page=1&output=json`);
        const data=await res.json();
        if(data.response.docs){
            const archiveVideos=data.response.docs.map(v=>({
                title:v.title,
                url:`https://archive.org/details/${v.identifier}`,
                rights:v.rights||"Unknown",
                thumbnail:`https://archive.org/services/get-item-image.php?identifier=${v.identifier}&mediatype=movies&thumb=1`,
                description:v.description||"",
                duration: 3600 // default 1h+
            }));
            allVideos=allVideos.concat(archiveVideos);
        }

        const unique={};
        const filtered=allVideos.filter(v=>{
            const key=v.title.toLowerCase().trim();
            if(unique[key]) return false;
            unique[key]=true;
            return v.title.toLowerCase().includes(query);
        });

        categorySection.innerHTML="";
        if(filtered.length===0){
            categorySection.innerHTML=`<p style="text-align:center;">No results found for "${query}"</p>`;
        } else {
            filtered.forEach(v=>grid.appendChild(createVideoCard(v)));
            categorySection.appendChild(grid);
        }
    } catch(err){
        console.error(err);
        categorySection.innerHTML=`<p style="text-align:center;color:red;">Error fetching results</p>`;
    }
});

// Initialize
showTrending();
showHome();