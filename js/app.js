// DOM Elements
const channelsContainer = document.getElementById('channelsContainer');
const playerContainer = document.getElementById('playerContainer');
const videoPlayer = document.getElementById('videoPlayer');
const channelNameElement = document.getElementById('channelName');
const serverOptions = document.getElementById('serverOptions');
const closePlayer = document.getElementById('closePlayer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryLinks = document.querySelectorAll('nav a');

// Global variables
let currentChannel = null;
let allChannels = [];

// Fetch channels from Firebase
function fetchChannels() {
    database.ref('/').once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            allChannels = [];
            
            // Extract channels from each category
            const categories = ['ent', 'news', 'sport', 'sport+', 'islamic', 'kids'];
            categories.forEach(category => {
                if (data[category]) {
                    Object.keys(data[category]).forEach(channelKey => {
                        const channel = data[category][channelKey];
                        channel.id = channelKey;
                        channel.category = category;
                        allChannels.push(channel);
                    });
                }
            });
            
            displayChannels(allChannels);
        })
        .catch((error) => {
            console.error('Error fetching channels:', error);
        });
}

// Display channels in the UI
function displayChannels(channels) {
    channelsContainer.innerHTML = '';
    
    channels.forEach(channel => {
        const channelCard = document.createElement('div');
        channelCard.className = 'channel-card';
        channelCard.dataset.id = channel.id;
        channelCard.dataset.category = channel.category;
        
        channelCard.innerHTML = `
            <img src="${channel.logolink}" alt="${channel['name ar']}" class="channel-img" onerror="this.src='https://via.placeholder.com/180x120?text=No+Image'">
            <div class="channel-info">
                <h3>${channel['name ar']}</h3>
                <p>${channel['name en']}</p>
            </div>
        `;
        
        channelCard.addEventListener('click', () => openChannelPlayer(channel));
        channelsContainer.appendChild(channelCard);
    });
}

// Open channel player
function openChannelPlayer(channel) {
    currentChannel = channel;
    channelNameElement.textContent = channel['name ar'];
    
    // Clear previous content
    videoPlayer.innerHTML = '';
    serverOptions.innerHTML = '';
    
    // Create server options
    for (let i = 1; i <= 5; i++) {
        if (channel[`link${i}`] && channel[`link${i}`].trim() !== '') {
            const serverBtn = document.createElement('button');
            serverBtn.className = 'server-btn';
            serverBtn.textContent = channel[`t${i}`] || `سيرفر ${i}`;
            serverBtn.dataset.serverIndex = i;
            
            if (i === 1) serverBtn.classList.add('active');
            
            serverBtn.addEventListener('click', () => {
                document.querySelectorAll('.server-btn').forEach(btn => btn.classList.remove('active'));
                serverBtn.classList.add('active');
                playChannel(i);
            });
            
            serverOptions.appendChild(serverBtn);
        }
    }
    
    // Play the first available server by default
    if (serverOptions.children.length > 0) {
        playChannel(1);
    }
    
    playerContainer.style.display = 'flex';
}

// Play channel stream
function playChannel(serverIndex) {
    videoPlayer.innerHTML = '';
    
    const link = currentChannel[`link${serverIndex}`];
    if (!link) return;
    
    // Check if it's a YouTube link
    if (link.includes('youtube.com') || link.includes('youtu.be')) {
        const videoId = extractYouTubeId(link);
        if (videoId) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('allow', 'autoplay');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            videoPlayer.appendChild(iframe);
            return;
        }
    }
    
    // Check if it's an HTML page (like match schedule)
    if (link.trim().startsWith('<!DOCTYPE html>')) {
        const iframe = document.createElement('iframe');
        iframe.srcdoc = link;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        videoPlayer.appendChild(iframe);
        return;
    }
    
    // For M3U8 or other streams
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(link);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play();
        });
        
        const video = document.createElement('video');
        video.controls = true;
        video.style.width = '100%';
        video.style.height = '100%';
        videoPlayer.appendChild(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari
        video.src = link;
        video.addEventListener('loadedmetadata', function() {
            video.play();
        });
    } else {
        videoPlayer.innerHTML = '<p>عذرًا، المتصفح لا يدعم تشغيل هذا النوع من البث.</p>';
    }
}

// Extract YouTube ID from URL
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Filter channels by category
function filterByCategory(category) {
    if (category === 'all') {
        displayChannels(allChannels);
    } else {
        const filtered = allChannels.filter(channel => channel.category === category);
        displayChannels(filtered);
    }
}

// Search channels
function searchChannels(query) {
    const filtered = allChannels.filter(channel => 
        channel['name ar'].includes(query) || 
        channel['name en'].toLowerCase().includes(query.toLowerCase())
    );
    displayChannels(filtered);
}

// Event listeners
closePlayer.addEventListener('click', () => {
    playerContainer.style.display = 'none';
});

searchBtn.addEventListener('click', () => {
    searchChannels(searchInput.value);
});

searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        searchChannels(searchInput.value);
    }
});

categoryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        categoryLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        filterByCategory(link.dataset.category);
    });
});

// Load HLS.js if needed
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
document.head.appendChild(script);

// Initialize the app
fetchChannels();
