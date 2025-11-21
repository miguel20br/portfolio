// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Fade-in animation on scroll
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(element => {
    observer.observe(element);
});

// Skill Card Toggle Logic
function toggleSkill(card) {
    // Close other cards (Accordion style) - Optional, but cleaner
    const allCards = document.querySelectorAll('.skill-card');
    allCards.forEach(c => {
        if (c !== card && c.classList.contains('active')) {
            c.classList.remove('active');
        }
    });

    // Toggle clicked card
    card.classList.toggle('active');
}
