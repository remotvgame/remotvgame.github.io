// DOM Elements
const channelsContainer = document.getElementById('channelsContainer');
const popupPlayer = document.getElementById('popupPlayer');
const hlsPlayer = document.getElementById('hlsPlayer');
const channelNameElement = document.getElementById('channelName');
const serverOptions = document.getElementById('serverOptions');
const closePopup = document.getElementById('closePopup');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryLinks = document.querySelectorAll('nav a');
const playerMessage = document.getElementById('playerMessage');

// Global variables
let currentChannel = null;
let allChannels = [];
let hls = null;

// Initialize HLS.js if available
function initHls() {
    if (Hls.isSupported()) {
        hls = new Hls();
        hls.on(Hls.Events.ERROR, function(event, data) {
            if (data.fatal) {
                showPlayerMessage('حدث خطأ في تشغيل البث. جرب سيرفرًا آخر.');
            }
        });
    }
}

// Fetch channels from Firebase
function fetchChannels() {
    showLoading(true);
    database.ref('/').once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            allChannels = [];
            
            // Extract channels from each category
            const categories = ['sport', 'sport+', 'ent', 'news', 'islamic', 'kids'];
            categories.forEach(category => {
                if (data[category]) {
                    Object.keys(data[category]).forEach(channelKey => {
                        const channel = data[category][channelKey];
                        if (channel['name ar'] && channel['name en']) { // Filter valid channels
                            channel.id = channelKey;
                            channel.category = category;
                            allChannels.push(channel);
                        }
                    });
                }
            });
            
            displayChannels(allChannels);
            showLoading(false);
        })
        .catch((error) => {
            console.error('Error fetching channels:', error);
            showLoading(false);
            showMessage('حدث خطأ في تحميل القنوات. يرجى المحاولة لاحقًا.');
        });
}

// Display channels in the UI
function displayChannels(channels) {
    channelsContainer.innerHTML = '';
    
    if (channels.length === 0) {
        channelsContainer.innerHTML = '<div class="no-channels">لا توجد قنوات متاحة في هذا القسم</div>';
        return;
    }
    
    channels.forEach(channel => {
        const channelCard = document.createElement('div');
        channelCard.className = 'channel-card';
        channelCard.dataset.id = channel.id;
        channelCard.dataset.category = channel.category;
        
        channelCard.innerHTML = `
            <img src="${channel.logolink || 'https://via.placeholder.com/180x120?text=No+Image'}" 
                 alt="${channel['name ar']}" 
                 class="channel-img"
                 onerror="this.src='https://via.placeholder.com/180x120?text=No+Image'">
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
    playerMessage.textContent = '';
    
    // Clear previous content
    serverOptions.innerHTML = '';
    
    // Create server options
    let hasValidServers = false;
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
            hasValidServers = true;
        }
    }
    
    if (!hasValidServers) {
        showPlayerMessage('لا توجد سيرفرات متاحة لهذه القناة');
    }
    
    // Show the popup and play the first available server
    popupPlayer.style.display = 'flex';
    if (hasValidServers) {
        playChannel(1);
    }
}

// Play channel stream
function playChannel(serverIndex) {
    // Reset player
    resetPlayer();
    playerMessage.textContent = 'جاري تحميل البث...';
    
    const link = currentChannel[`link${serverIndex}`];
    if (!link) {
        showPlayerMessage('رابط البث غير متوفر');
        return;
    }
    
    // Check if it's a YouTube link
    if (isYouTubeLink(link)) {
        playYouTube(link);
        return;
    }
    
    // Check if it's an HTML page (like match schedule)
    if (isHtmlContent(link)) {
        playHtmlContent(link);
        return;
    }
    
    // For M3U8 or other streams
    playHlsStream(link);
}

// Play YouTube video
function playYouTube(url) {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
        showPlayerMessage('رابط اليوتيوب غير صالح');
        return;
    }
    
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'autoplay; encrypted-media');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    
    hlsPlayer.parentNode.appendChild(iframe);
    playerMessage.textContent = '';
}

// Play HTML content
function playHtmlContent(html) {
    const iframe = document.createElement('iframe');
    iframe.srcdoc = html;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    
    hlsPlayer.parentNode.appendChild(iframe);
    playerMessage.textContent = '';
}

// Play HLS stream
function playHlsStream(url) {
    if (Hls.isSupported()) {
        hls.loadSource(url);
        hls.attachMedia(hlsPlayer);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            hlsPlayer.play().catch(e => {
                showPlayerMessage('لا يمكن تشغيل البث تلقائيًا. يرجى الضغط على زر التشغيل.');
            });
            playerMessage.textContent = '';
        });
    } else if (hlsPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari
        hlsPlayer.src = url;
        hlsPlayer.addEventListener('loadedmetadata', function() {
            hlsPlayer.play().catch(e => {
                showPlayerMessage('لا يمكن تشغيل البث تلقائيًا. يرجى الضغط على زر التشغيل.');
            });
            playerMessage.textContent = '';
        });
    } else {
        showPlayerMessage('المتصفح لا يدعم تشغيل هذا النوع من البث');
    }
}

// Reset player
function resetPlayer() {
    // Destroy previous HLS instance
    if (hls) {
        hls.destroy();
    }
    
    // Remove any iframes
    const iframe = hlsPlayer.parentNode.querySelector('iframe');
    if (iframe) {
        iframe.remove();
    }
    
    // Reset video element
    hlsPlayer.src = '';
    hlsPlayer.removeAttribute('src');
}

// Extract YouTube ID from URL
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Check if link is YouTube
function isYouTubeLink(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

// Check if content is HTML
function isHtmlContent(content) {
    return content.trim().startsWith('<!DOCTYPE html>') || 
           content.trim().startsWith('<html') || 
           content.includes('<body>');
}

// Filter channels by category
function filterByCategory(category) {
    const filtered = allChannels.filter(channel => channel.category === category);
    displayChannels(filtered);
    
    // Update active nav link
    categoryLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`nav a[data-category="${category}"]`).classList.add('active');
}

// Search channels
function searchChannels(query) {
    if (!query.trim()) {
        displayChannels(allChannels);
        return;
    }
    
    const filtered = allChannels.filter(channel => 
        channel['name ar'].includes(query) || 
        channel['name en'].toLowerCase().includes(query.toLowerCase())
    );
    displayChannels(filtered);
}

// Show loading state
function showLoading(show) {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

// Show message
function showMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.textContent = message;
    channelsContainer.appendChild(messageElement);
}

// Show player message
function showPlayerMessage(message) {
    playerMessage.textContent = message;
}

// Event listeners
closePopup.addEventListener('click', () => {
    popupPlayer.style.display = 'none';
    resetPlayer();
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
        filterByCategory(link.dataset.category);
    });
});

// Initialize the app
initHls();
fetchChannels();

// Start with sport category by default
filterByCategory('sport');