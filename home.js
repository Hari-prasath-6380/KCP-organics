const API_URL = 'http://localhost:5000/api';

// Load Home videos on page load
document.addEventListener('DOMContentLoaded', () => {
    loadHomeVideos();
    checkUserAuthentication();
});

// Check if user is logged in
function checkUserAuthentication() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    
    const loginLink = document.getElementById('loginLink');
    const signupLink = document.getElementById('signupLink');
    const userNameSpan = document.getElementById('userName');
    const logoutLink = document.getElementById('logoutLink');
    const cartBadge = document.getElementById('cartBadge');

    if (token) {
        loginLink.style.display = 'none';
        signupLink.style.display = 'none';
        userNameSpan.style.display = 'inline';
        userNameSpan.textContent = userName || 'User';
        logoutLink.style.display = 'inline';
        
        // Load cart count
        loadCartCount();
    }
}

// Load cart count
function loadCartCount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/cart`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.data) {
            const count = data.data.items ? data.data.items.length : 0;
            document.getElementById('cartBadge').textContent = count;
        }
    })
    .catch(err => console.log('Error loading cart:', err));
}

// Load Home videos
function loadHomeVideos() {
    fetch(`${API_URL}/videos?category=home&active=true`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data && data.data.length > 0) {
                displayHomeVideos(data.data);
            } else {
                displayNoHomeVideos();
            }
        })
        .catch(err => {
            console.error('Error loading videos:', err);
            displayNoHomeVideos();
        });
}

// Display videos
function displayHomeVideos(videos) {
    const videosGrid = document.getElementById('homeVideosGrid');
    const noVideosMessage = document.getElementById('noHomeVideosMessage');
    
    // Clear existing videos
    videosGrid.innerHTML = '';
    
    if (noVideosMessage) {
        noVideosMessage.style.display = 'none';
    }

    videos.forEach((video, index) => {
        const videoItem = createHomeVideoElement(video);
        videosGrid.appendChild(videoItem);
        
        // Add animation delay
        setTimeout(() => {
            videoItem.style.opacity = '1';
            videoItem.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Create video element
function createHomeVideoElement(video) {
    const videoItem = document.createElement('div');
    videoItem.className = 'home-video-item';
    videoItem.style.opacity = '0';
    videoItem.style.transform = 'translateY(20px)';
    videoItem.style.transition = 'all 0.5s ease';

    const videoThumbnail = document.createElement('div');
    videoThumbnail.className = 'home-video-thumbnail';

    // Check if video URL is YouTube or Vimeo
    if (video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be')) {
        const videoId = extractYoutubeId(video.videoUrl);
        videoThumbnail.innerHTML = `
            <div class="video-wrapper">
                <iframe 
                    width="100%" 
                    height="315"
                    src="https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1" 
                    title="${video.title}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="border: none; border-radius: 8px;">
                </iframe>
            </div>
        `;
    } else if (video.videoUrl.includes('vimeo.com')) {
        const videoId = extractVimeoId(video.videoUrl);
        videoThumbnail.innerHTML = `
            <div class="video-wrapper">
                <iframe 
                    width="100%" 
                    height="315"
                    src="https://player.vimeo.com/video/${videoId}?h=&badge=0&autopause=0&player_id=0&app_id=58479" 
                    title="${video.title}"
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowfullscreen
                    style="border: none; border-radius: 8px;">
                </iframe>
            </div>
        `;
    } else if (video.videoUrl.includes('/uploads/') || video.videoUrl.endsWith('.mp4') || video.videoUrl.endsWith('.webm')) {
        // Direct video file upload
        let videoUrl = video.videoUrl;
        
        // If URL is relative, make it absolute
        if (!videoUrl.startsWith('http')) {
            // Extract the server URL from API_URL
            const serverUrl = API_URL.split('/api')[0];
            videoUrl = serverUrl + videoUrl;
        }
        
        console.log('Playing direct video:', videoUrl);
        
        videoThumbnail.innerHTML = `
            <div class="video-wrapper">
                <video 
                    preload="metadata"
                    muted
                    loop
                    playsinline
                    style="width: 100%; height: 100%; background: #000;">
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>
        `;
        
        // Add hover play/pause
        setTimeout(() => {
            const videoElement = videoThumbnail.querySelector('video');
            if (videoElement) {
                videoThumbnail.addEventListener('mouseenter', () => videoElement.play());
                videoThumbnail.addEventListener('mouseleave', () => {
                    videoElement.pause();
                    videoElement.currentTime = 0;
                });
            }
        }, 100);
    } else {
        // Direct video URL or thumbnail
        const img = document.createElement('img');
        img.src = video.thumbnailUrl || 'https://via.placeholder.com/320x180?text=Video';
        img.alt = video.title;
        img.onerror = () => img.src = 'https://via.placeholder.com/320x180?text=Video';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        videoThumbnail.appendChild(img);
    }

    const videoInfo = document.createElement('div');
    videoInfo.className = 'home-video-info';
    
    const title = document.createElement('h3');
    title.textContent = video.title;
    videoInfo.appendChild(title);

    if (video.description) {
        const description = document.createElement('p');
        description.textContent = video.description.substring(0, 100) + (video.description.length > 100 ? '...' : '');
        description.style.color = '#666';
        description.style.fontSize = '14px';
        videoInfo.appendChild(description);
    }

    videoItem.appendChild(videoThumbnail);
    videoItem.appendChild(videoInfo);

    return videoItem;
}

// Extract YouTube video ID
function extractYoutubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

// Extract Vimeo video ID
function extractVimeoId(url) {
    const regExp = /(https?:\/\/)?(www\.)?(vimeo\.com\/)(\d+)/;
    const match = url.match(regExp);
    return match ? match[4] : url;
}

// Toggle cart
function toggleCart() {
    window.location.href = 'cart.html';
}

// Logout user
function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    location.reload();
}

// Display no videos message
function displayNoHomeVideos() {
    const noVideosMessage = document.getElementById('noHomeVideosMessage');
    if (noVideosMessage) {
        noVideosMessage.style.display = 'flex';
    }
}
