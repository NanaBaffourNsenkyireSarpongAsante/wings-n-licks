// ============================================
// MOBILE MENU TOGGLE
// ============================================
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    const menuIcon = document.querySelector('.mobile-menu-btn i');
    
    if (navLinks) {
        navLinks.classList.toggle('active');
        
        if (navLinks.classList.contains('active')) {
            if (menuIcon) menuIcon.className = 'fas fa-times';
        } else {
            if (menuIcon) menuIcon.className = 'fas fa-bars';
        }
    }
}

// ============================================
// CLOSE MOBILE MENU ON LINK CLICK
// ============================================
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function() {
        const navLinks = document.getElementById('navLinks');
        const menuIcon = document.querySelector('.mobile-menu-btn i');
        if (navLinks) {
            navLinks.classList.remove('active');
            if (menuIcon) menuIcon.className = 'fas fa-bars';
        }
    });
});

// ============================================
// CLOSE MOBILE MENU ON CLICK OUTSIDE
// ============================================
document.addEventListener('click', (event) => {
    const navLinks = document.getElementById('navLinks');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (navLinks && menuBtn) {
        if (!navLinks.contains(event.target) && !menuBtn.contains(event.target)) {
            navLinks.classList.remove('active');
            const menuIcon = document.querySelector('.mobile-menu-btn i');
            if (menuIcon) {
                menuIcon.className = 'fas fa-bars';
            }
        }
    }
});

// ============================================
// ANIMATED NAVIGATION INDICATOR
// ============================================
const navLinks = document.querySelectorAll('.nav-links a');
const indicator = document.querySelector('.nav-indicator');

function moveIndicator(link) {
    if (window.innerWidth <= 768) return;
    if (!indicator) return;
    
    const rect = link.getBoundingClientRect();
    const parentRect = link.parentElement.parentElement.getBoundingClientRect();
    indicator.style.width = rect.width + 'px';
    indicator.style.height = rect.height + 'px';
    indicator.style.left = (rect.left - parentRect.left) + 'px';
    indicator.style.top = '0';
}

window.addEventListener('load', () => {
    const firstLink = document.querySelector('.nav-links a');
    if (firstLink && window.innerWidth > 768) {
        moveIndicator(firstLink);
    }
});

navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => moveIndicator(link));
});

const navLinksContainer = document.querySelector('.nav-links');
if (navLinksContainer) {
    navLinksContainer.addEventListener('mouseleave', () => {
        if (window.innerWidth <= 768) return;
        const activeLink = document.querySelector('.nav-links a:hover') || document.querySelector('.nav-links a');
        if (activeLink) moveIndicator(activeLink);
    });
}

// ============================================
// HANDLE WINDOW RESIZE
// ============================================
window.addEventListener('resize', () => {
    const firstLink = document.querySelector('.nav-links a');
    if (window.innerWidth > 768 && firstLink && indicator) {
        moveIndicator(firstLink);
    }
});

// ============================================
// AUTO-SCROLL DELIVERY ZONES
// ============================================
const zonesGrid = document.querySelector('.zones-grid');

if (zonesGrid) {
    let scrollAmount = 0;
    let scrollDirection = 1;

    function autoScrollZones() {
        if (!zonesGrid) return;

        scrollAmount += scrollDirection;

        if (scrollAmount >= zonesGrid.scrollWidth - zonesGrid.clientWidth) {
            scrollDirection = -1;
        } else if (scrollAmount <= 0) {
            scrollDirection = 1;
        }

        zonesGrid.scrollLeft = scrollAmount;
        requestAnimationFrame(autoScrollZones);
    }

    setTimeout(autoScrollZones, 2000);

    zonesGrid.addEventListener('mouseenter', () => {
        scrollDirection = 0;
    });

    zonesGrid.addEventListener('mouseleave', () => {
        scrollDirection = 1;
    });
}

// ============================================
// SMOOTH SCROLL FOR NAVIGATION LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

console.log('✅ Brown\'s Kitchen - JavaScript loaded successfully!');