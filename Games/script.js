// Authentication System
let currentUser = null;

// User storage in localStorage
function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : {};
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
    } else {
        localStorage.removeItem('currentUser');
        currentUser = null;
    }
}

function hashPassword(password) {
    // Simple hash function (for demo purposes)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

function register(username, email, password) {
    const users = getUsers();
    
    if (users[username]) {
        return { success: false, message: 'Username already exists' };
    }
    
    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
    }
    
    users[username] = {
        username,
        email,
        passwordHash: hashPassword(password),
        stats: {
            totalScore: 0,
            highestLevel: 1,
            gamesPlayed: 0,
            bestScores: {
                memory: 0,
                reaction: 0,
                pattern: 0,
                typing: 0,
                puzzle: 0,
                concentration: 0
            }
        },
        createdAt: new Date().toISOString()
    };
    
    saveUsers(users);
    return { success: true, user: users[username] };
}

function login(username, password) {
    const users = getUsers();
    const user = users[username];
    
    if (!user) {
        return { success: false, message: 'Username not found' };
    }
    
    if (user.passwordHash !== hashPassword(password)) {
        return { success: false, message: 'Incorrect password' };
    }
    
    setCurrentUser(user);
    return { success: true, user };
}

function logout() {
    setCurrentUser(null);
    updateUI();
}

function updateUserStats(gameType, gameScore, gameLevel, incrementGamesPlayed = false) {
    if (!currentUser) return;
    
    const users = getUsers();
    const user = users[currentUser.username];
    
    if (!user) return;
    
    user.stats.totalScore = Math.max(0, user.stats.totalScore + gameScore);
    user.stats.highestLevel = Math.max(user.stats.highestLevel, gameLevel);
    
    if (incrementGamesPlayed) {
        user.stats.gamesPlayed++;
    }
    
    users[currentUser.username] = user;
    saveUsers(users);
    setCurrentUser(user);
}

function saveGameSessionStats() {
    if (currentGameType && currentUser) {
        const users = getUsers();
        const user = users[currentUser.username];
        
        if (user) {
            // Update best score for this game type
            if (score > user.stats.bestScores[currentGameType]) {
                user.stats.bestScores[currentGameType] = score;
            }
            
            // Update highest level
            user.stats.highestLevel = Math.max(user.stats.highestLevel, level);
            
            // Increment total score and games played only if score > 0
            if (score > 0) {
                user.stats.totalScore += score;
                user.stats.gamesPlayed++;
            }
            
            users[currentUser.username] = user;
            saveUsers(users);
            setCurrentUser(user);
        }
    }
}

function updateUI() {
    const authSection = document.getElementById('auth-section');
    const gameMenu = document.getElementById('game-menu');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const profileBtn = document.getElementById('profile-btn');
    const loginHeaderBtn = document.getElementById('login-header-btn');
    const currentUsername = document.getElementById('current-username');
    
    currentUser = getCurrentUser();
    
    if (currentUser) {
        // User is logged in
        authSection.classList.add('hidden');
        gameMenu.classList.remove('hidden');
        usernameDisplay.textContent = `Welcome, ${currentUser.username}`;
        usernameDisplay.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        profileBtn.classList.remove('hidden');
        loginHeaderBtn.classList.add('hidden');
        if (currentUsername) {
            currentUsername.textContent = currentUser.username;
        }
    } else {
        // User is not logged in
        authSection.classList.add('hidden'); // Hidden by default, shown when login button clicked
        gameMenu.classList.remove('hidden'); // Show games but they'll require login
        usernameDisplay.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        profileBtn.classList.add('hidden');
        loginHeaderBtn.classList.remove('hidden');
    }
}

function toggleAuthSection() {
    const authSection = document.getElementById('auth-section');
    authSection.classList.toggle('hidden');
    
    // Scroll to auth section when opening
    if (!authSection.classList.contains('hidden')) {
        authSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showProfile() {
    if (!currentUser) return;
    
    const user = getUsers()[currentUser.username];
    const modal = document.getElementById('profile-modal');
    
    document.getElementById('total-score').textContent = user.stats.totalScore;
    document.getElementById('highest-level').textContent = user.stats.highestLevel;
    document.getElementById('games-played').textContent = user.stats.gamesPlayed;
    
    const bestScoresDiv = document.getElementById('best-scores');
    bestScoresDiv.innerHTML = '';
    
    const gameNames = {
        memory: 'Memory Match',
        reaction: 'Reaction Test',
        pattern: 'Pattern Sequence',
        typing: 'Typing Challenge',
        puzzle: 'Puzzle Escape',
        concentration: 'Concentration Focus'
    };
    
    for (const [game, score] of Object.entries(user.stats.bestScores)) {
        const scoreDiv = document.createElement('div');
        scoreDiv.textContent = `${gameNames[game]}: ${score}`;
        bestScoresDiv.appendChild(scoreDiv);
    }
    
    modal.classList.remove('hidden');
}

// EmailJS Configuration
// TODO: Replace these with your EmailJS credentials
// Get them from: https://www.emailjs.com/
const EMAILJS_CONFIG = {
    SERVICE_ID: 'YOUR_SERVICE_ID',      // Replace with your EmailJS service ID
    TEMPLATE_ID: 'YOUR_TEMPLATE_ID',     // Replace with your EmailJS template ID
    PUBLIC_KEY: 'YOUR_PUBLIC_KEY'        // Replace with your EmailJS public key
};

// Initialize EmailJS (will use the config above)
function initEmailJS() {
    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    }
}

// Review form functions
let selectedRating = 0;

function showReviewModal() {
    const modal = document.getElementById('review-modal');
    modal.classList.remove('hidden');
    
    // Reset form
    document.getElementById('review-form').reset();
    selectedRating = 0;
    updateStarDisplay();
    
    // Pre-fill with logged in user if available
    if (currentUser) {
        const user = getUsers()[currentUser.username];
        document.getElementById('reviewer-name').value = currentUser.username;
        document.getElementById('reviewer-email').value = user.email || '';
    }
}

function updateStarDisplay() {
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('rating-value');
    
    stars.forEach((star, index) => {
        if (index < selectedRating) {
            star.style.opacity = '1';
            star.style.transform = 'scale(1.2)';
        } else {
            star.style.opacity = '0.5';
            star.style.transform = 'scale(1)';
        }
    });
    
    ratingValue.textContent = selectedRating > 0 ? `${selectedRating}/5` : '0';
}

function handleReviewSubmit() {
    const name = document.getElementById('reviewer-name').value.trim();
    const email = document.getElementById('reviewer-email').value.trim();
    const recipientEmail = document.getElementById('recipient-email').value.trim();
    const message = document.getElementById('review-message').value.trim();
    const statusMsg = document.getElementById('review-status');
    const submitBtn = document.getElementById('submit-review-btn');
    
    if (!name || !email || !message || selectedRating === 0) {
        statusMsg.textContent = 'Please fill in all fields and select a rating!';
        statusMsg.style.color = '#000';
        return;
    }
    
    if (!validateEmail(email)) {
        statusMsg.textContent = 'Please enter a valid email address!';
        statusMsg.style.color = '#000';
        return;
    }
    
    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    statusMsg.textContent = 'Sending your review...';
    statusMsg.style.color = '#000';
    
    // Prepare email data
    const emailData = {
        from_name: name,
        from_email: email,
        to_email: recipientEmail || 'your-email@example.com', // Default recipient
        rating: selectedRating,
        message: message,
        subject: `Game Review - ${selectedRating}/5 Stars`,
        reply_to: email
    };
    
    // Send email using EmailJS
    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.SERVICE_ID !== 'YOUR_SERVICE_ID') {
        emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            emailData
        ).then(() => {
            statusMsg.textContent = '✓ Review sent successfully! Thank you for your feedback!';
            statusMsg.style.color = '#000';
            submitBtn.textContent = 'Review Sent!';
            
            // Reset form after 2 seconds
            setTimeout(() => {
                document.getElementById('review-form').reset();
                selectedRating = 0;
                updateStarDisplay();
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Review';
                statusMsg.textContent = '';
                
                // Close modal after 3 seconds
                setTimeout(() => {
                    document.getElementById('review-modal').classList.add('hidden');
                }, 1000);
            }, 2000);
        }).catch((error) => {
            console.error('EmailJS Error:', error);
            statusMsg.textContent = 'Failed to send review. Please try again later.';
            statusMsg.style.color = '#000';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Review';
        });
    } else {
        // Fallback: Store review locally and show success message
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        reviews.push({
            name,
            email,
            recipientEmail,
            rating: selectedRating,
            message,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('reviews', JSON.stringify(reviews));
        
        statusMsg.textContent = '✓ Review saved! (EmailJS not configured - review stored locally)';
        statusMsg.style.color = '#808080';
        submitBtn.textContent = 'Review Saved!';
        
        // Show info about EmailJS setup
        alert('Review saved locally!\n\nTo enable email sending:\n1. Sign up at https://www.emailjs.com/\n2. Create a service and template\n3. Update EMAILJS_CONFIG in script.js with your credentials');
        
        setTimeout(() => {
            document.getElementById('review-form').reset();
            selectedRating = 0;
            updateStarDisplay();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Review';
            statusMsg.textContent = '';
        }, 3000);
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Game State Management
let currentGame = null;
let currentGameType = null;
let score = 0;
let level = 1;

// Login handler function (global for form onsubmit)
function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');
    
    if (!username || !password) {
        errorMsg.textContent = 'Please fill in all fields';
        errorMsg.style.display = 'block';
        return;
    }
    
    const result = login(username, password);
    if (result.success) {
        errorMsg.textContent = '';
        errorMsg.style.display = 'none';
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        updateUI();
        // Hide auth section after successful login
        document.getElementById('auth-section').classList.add('hidden');
    } else {
        errorMsg.textContent = result.message;
        errorMsg.style.display = 'block';
    }
}

// Register handler function (global for form onsubmit)
function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const errorMsg = document.getElementById('register-error');
    
    if (!username || !email || !password || !confirm) {
        errorMsg.textContent = 'Please fill in all fields';
        errorMsg.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        errorMsg.textContent = 'Password must be at least 6 characters';
        errorMsg.style.display = 'block';
        return;
    }
    
    if (password !== confirm) {
        errorMsg.textContent = 'Passwords do not match';
        errorMsg.style.display = 'block';
        return;
    }
    
    const result = register(username, email, password);
    if (result.success) {
        errorMsg.textContent = '';
        errorMsg.style.display = 'none';
        document.getElementById('register-username').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-confirm').value = '';
        
        // Auto login after registration
        setCurrentUser(result.user);
        updateUI();
        // Hide auth section after successful registration
        document.getElementById('auth-section').classList.add('hidden');
    } else {
        errorMsg.textContent = result.message;
        errorMsg.style.display = 'block';
    }
}

// Game initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    updateUI();
    
    // Login header button to show auth section
    document.getElementById('login-header-btn').addEventListener('click', () => {
        toggleAuthSection();
    });
    
    // Close auth section button
    document.getElementById('close-auth-btn').addEventListener('click', () => {
        document.getElementById('auth-section').classList.add('hidden');
    });
    
    // Authentication event listeners
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
            const formId = tab.dataset.tab === 'login' ? 'login-form' : 'register-form';
            document.getElementById(formId).classList.add('active');
            
            // Clear error messages when switching tabs
            document.getElementById('login-error').textContent = '';
            document.getElementById('register-error').textContent = '';
            
            // Show auth section if switching tabs while it's visible
            if (!document.getElementById('auth-section').classList.contains('hidden')) {
                // Already visible, no need to scroll
            }
        });
    });
    
    // Button click handlers (backup to form submit)
    document.getElementById('login-btn').addEventListener('click', (e) => {
        e.preventDefault();
        handleLogin();
    });
    
    document.getElementById('register-btn').addEventListener('click', (e) => {
        e.preventDefault();
        handleRegister();
    });
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        logout();
    });
    
    document.getElementById('profile-btn').addEventListener('click', () => {
        showProfile();
    });
    
    // Review button
    document.getElementById('review-btn').addEventListener('click', () => {
        showReviewModal();
    });
    
    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.id === 'close-review-modal') {
                document.getElementById('review-modal').classList.add('hidden');
            } else {
                document.getElementById('profile-modal').classList.add('hidden');
            }
        });
    });
    
    // Star rating functionality
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            updateStarDisplay();
        });
        
        star.addEventListener('mouseenter', () => {
            const hoverRating = parseInt(star.dataset.rating);
            const allStars = document.querySelectorAll('.star');
            allStars.forEach((s, index) => {
                if (index < hoverRating) {
                    s.style.opacity = '1';
                    s.style.transform = 'scale(1.2)';
                } else {
                    s.style.opacity = '0.5';
                    s.style.transform = 'scale(1)';
                }
            });
        });
    });
    
    // Reset stars on mouse leave
    document.querySelector('.stars')?.addEventListener('mouseleave', () => {
        updateStarDisplay();
    });
    
    // Initialize EmailJS
    initEmailJS();
    
    // Close modal when clicking outside
    document.getElementById('profile-modal').addEventListener('click', (e) => {
        if (e.target.id === 'profile-modal') {
            document.getElementById('profile-modal').classList.add('hidden');
        }
    });
    
    document.getElementById('review-modal').addEventListener('click', (e) => {
        if (e.target.id === 'review-modal') {
            document.getElementById('review-modal').classList.add('hidden');
        }
    });
    
    // Enter key support for all input fields
    const loginInputs = document.querySelectorAll('#login-form input');
    loginInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLogin();
            }
        });
    });
    
    const registerInputs = document.querySelectorAll('#register-form input');
    registerInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleRegister();
            }
        });
    });
    const gameCards = document.querySelectorAll('.game-card');
    const backBtn = document.getElementById('back-btn');
    const gameMenu = document.getElementById('game-menu');
    const gameArea = document.getElementById('game-area');

    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please login to play games!');
                return;
            }
            const gameType = card.dataset.game;
            startGame(gameType);
        });
    });

    backBtn.addEventListener('click', () => {
        // Save game stats before going back
        saveGameSessionStats();
        
        gameMenu.classList.remove('hidden');
        gameArea.classList.add('hidden');
        if (currentGame && currentGame.cleanup) {
            currentGame.cleanup();
        }
        currentGame = null;
        currentGameType = null;
        score = 0;
        level = 1;
    });
});

function startGame(gameType) {
    if (!currentUser) {
        alert('Please login to play games!');
        return;
    }
    
    const gameMenu = document.getElementById('game-menu');
    const gameArea = document.getElementById('game-area');
    const gameContent = document.getElementById('game-content');

    gameMenu.classList.add('hidden');
    gameArea.classList.remove('hidden');
    
    score = 0;
    level = 1;
    currentGameType = gameType;
    updateScore();

    switch(gameType) {
        case 'memory':
            currentGame = new MemoryGame(gameContent);
            break;
        case 'reaction':
            currentGame = new ReactionGame(gameContent);
            break;
        case 'pattern':
            currentGame = new PatternGame(gameContent);
            break;
        case 'typing':
            currentGame = new TypingGame(gameContent);
            break;
        case 'puzzle':
            currentGame = new PuzzleGame(gameContent);
            break;
        case 'concentration':
            currentGame = new ConcentrationGame(gameContent);
            break;
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
}

function addScore(points) {
    score += points;
    updateScore();
}

function increaseLevel() {
    level++;
    updateScore();
}

// Memory Match Game
class MemoryGame {
    constructor(container) {
        this.container = container;
        this.gridSize = 4;
        this.cards = [];
        this.flippedCards = [];
        this.matches = 0;
        this.moves = 0;
        this.init();
    }

    init() {
        const symbols = ['🔒', '📱', '💻', '⌨️', '🖱️', '🖥️', '📺', '🎮'];
        const pairs = [...symbols, ...symbols];
        this.shuffle(pairs);
        
        this.container.innerHTML = `
            <h2>Memory Match - Find the Pairs</h2>
            <p>Match pairs of symbols. Moves: <span id="moves">0</span></p>
            <div class="memory-grid"></div>
        `;

        const grid = this.container.querySelector('.memory-grid');
        grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

        pairs.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.symbol = symbol;
            card.dataset.index = index;
            card.addEventListener('click', () => this.flipCard(card));
            grid.appendChild(card);
            this.cards.push(card);
        });
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    flipCard(card) {
        if (card.classList.contains('flipped') || card.classList.contains('matched') || this.flippedCards.length === 2) {
            return;
        }

        card.classList.add('flipped');
        card.textContent = card.dataset.symbol;
        this.flippedCards.push(card);
        this.moves++;
        document.getElementById('moves').textContent = this.moves;

        if (this.flippedCards.length === 2) {
            setTimeout(() => this.checkMatch(), 1000);
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.dataset.symbol === card2.dataset.symbol) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matches++;
            addScore(10);
            
            if (this.matches === this.cards.length / 2) {
                setTimeout(() => {
                    alert(`Congratulations! You completed the game in ${this.moves} moves!`);
                    saveGameSessionStats();
                    increaseLevel();
                    this.init();
                }, 500);
            }
        } else {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.textContent = '';
            card2.textContent = '';
        }
        
        this.flippedCards = [];
    }

    cleanup() {
        // Cleanup if needed
    }
}

// Reaction Test Game
class ReactionGame {
    constructor(container) {
        this.container = container;
        this.reactions = [];
        this.waiting = false;
        this.startTime = null;
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <h2>Reaction Test - Click When Green!</h2>
            <div class="reaction-game">
                <button class="reaction-button waiting" id="reaction-btn">Wait for Green</button>
                <div class="reaction-stats">
                    <p>Average: <span id="avg-time">-</span>ms</p>
                    <p>Best: <span id="best-time">-</span>ms</p>
                    <p>Reactions: <span id="reaction-count">0</span></p>
                </div>
            </div>
        `;

        const button = document.getElementById('reaction-btn');
        button.addEventListener('click', () => this.handleClick());
        
        this.startRound();
    }

    startRound() {
        const button = document.getElementById('reaction-btn');
        button.classList.remove('ready', 'too-early');
        button.classList.add('waiting');
        button.textContent = 'Wait for Green';
        this.waiting = true;
        
        const waitTime = Math.random() * 3000 + 2000; // 2-5 seconds
        
        setTimeout(() => {
            if (this.waiting) {
                button.classList.remove('waiting');
                button.classList.add('ready');
                button.textContent = 'CLICK NOW!';
                this.startTime = Date.now();
            }
        }, waitTime);
    }

    handleClick() {
        const button = document.getElementById('reaction-btn');
        
        if (button.classList.contains('waiting')) {
            button.classList.add('too-early');
            button.textContent = 'Too Early! Wait...';
            this.waiting = false;
            setTimeout(() => this.startRound(), 2000);
            return;
        }
        
        if (button.classList.contains('ready')) {
            const reactionTime = Date.now() - this.startTime;
            this.reactions.push(reactionTime);
            this.updateStats();
            addScore(Math.max(0, 300 - reactionTime));
            
            button.textContent = `${reactionTime}ms - Click for Next`;
            button.classList.remove('ready');
            button.classList.add('waiting');
            
            setTimeout(() => this.startRound(), 1500);
        }
    }

    updateStats() {
        const avg = Math.round(this.reactions.reduce((a, b) => a + b, 0) / this.reactions.length);
        const best = Math.min(...this.reactions);
        
        document.getElementById('avg-time').textContent = avg;
        document.getElementById('best-time').textContent = best;
        document.getElementById('reaction-count').textContent = this.reactions.length;
        
        if (this.reactions.length === 5) {
            increaseLevel();
        }
    }

    cleanup() {
        this.waiting = false;
    }
}

// Pattern Sequence Game
class PatternGame {
    constructor(container) {
        this.container = container;
        this.sequence = [];
        this.userSequence = [];
        this.currentStep = 0;
        this.showingSequence = false;
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <h2>Pattern Sequence - Follow the Pattern</h2>
            <p>Watch the sequence and repeat it!</p>
            <div class="pattern-game">
                <div class="pattern-sequence" id="pattern-buttons"></div>
                <p id="game-status">Watch the pattern...</p>
                <button id="start-pattern" style="margin-top: 20px; padding: 10px 20px; font-size: 1em; background: rgba(0,0,0,0.1); border: 2px solid rgba(0,0,0,0.3); color: #000; border-radius: 8px; cursor: pointer;">Start Game</button>
            </div>
        `;

        const colors = ['🔴', '🟢', '🔵', '🟡'];
        const buttonsDiv = document.getElementById('pattern-buttons');
        
        colors.forEach((color, index) => {
            const btn = document.createElement('button');
            btn.className = 'pattern-btn';
            btn.textContent = color;
            btn.dataset.index = index;
            btn.addEventListener('click', () => this.handleClick(index));
            buttonsDiv.appendChild(btn);
        });

        document.getElementById('start-pattern').addEventListener('click', () => {
            this.startNewRound();
        });
    }

    startNewRound() {
        this.sequence = [];
        this.userSequence = [];
        this.currentStep = 0;
        this.sequence.push(Math.floor(Math.random() * 4));
        this.showSequence();
    }

    showSequence() {
        this.showingSequence = true;
        document.getElementById('game-status').textContent = 'Watch the pattern...';
        const buttons = document.querySelectorAll('.pattern-btn');
        
        buttons.forEach(btn => btn.style.pointerEvents = 'none');
        
        let i = 0;
        const showNext = () => {
            if (i < this.sequence.length) {
                const btn = buttons[this.sequence[i]];
                btn.classList.add('active');
                setTimeout(() => {
                    btn.classList.remove('active');
                    i++;
                    setTimeout(showNext, 500);
                }, 400);
            } else {
                this.showingSequence = false;
                buttons.forEach(btn => btn.style.pointerEvents = 'auto');
                document.getElementById('game-status').textContent = 'Your turn! Repeat the pattern...';
            }
        };
        
        setTimeout(showNext, 500);
    }

    handleClick(index) {
        if (this.showingSequence || this.sequence.length === 0) return;
        
        const buttons = document.querySelectorAll('.pattern-btn');
        buttons[index].classList.add('active');
        setTimeout(() => buttons[index].classList.remove('active'), 200);
        
        this.userSequence.push(index);
        
        if (this.userSequence[this.currentStep] !== this.sequence[this.currentStep]) {
            document.getElementById('game-status').textContent = 'Wrong! Starting over...';
            buttons[index].classList.add('wrong');
            setTimeout(() => {
                buttons[index].classList.remove('wrong');
                this.startNewRound();
            }, 1500);
            return;
        }
        
        buttons[index].classList.add('correct');
        setTimeout(() => buttons[index].classList.remove('correct'), 300);
        
        this.currentStep++;
        
        if (this.currentStep === this.sequence.length) {
            addScore(20);
            this.currentStep = 0;
            this.userSequence = [];
            this.sequence.push(Math.floor(Math.random() * 4));
            
            setTimeout(() => {
                document.getElementById('game-status').textContent = 'Correct! Next round...';
                setTimeout(() => this.showSequence(), 1000);
            }, 500);
            
            if (this.sequence.length === 5) {
                increaseLevel();
            }
        }
    }

    cleanup() {
        // Cleanup if needed
    }
}

// Typing Challenge Game
class TypingGame {
    constructor(container) {
        this.container = container;
        this.currentText = '';
        this.userInput = '';
        this.currentIndex = 0;
        this.startTime = null;
        this.init();
    }

    init() {
        const texts = [
            "Break free from digital chains. Your mind is stronger than screens.",
            "Every moment offline is a step toward freedom. Reclaim your time.",
            "The invisible prison exists only if you let it. Choose liberation.",
            "Digital addiction fades when you regain control of your attention.",
            "Real life awaits beyond the screen. Look up and live fully."
        ];
        
        this.currentText = texts[Math.floor(Math.random() * texts.length)];
        this.currentIndex = 0;
        this.startTime = Date.now();
        
        this.container.innerHTML = `
            <h2>Typing Challenge - Type the Message</h2>
            <div class="typing-game">
                <div class="typing-text" id="typing-text"></div>
                <input type="text" class="typing-input" id="typing-input" placeholder="Start typing...">
                <div class="typing-stats">
                    <span>WPM: <span id="wpm">0</span></span>
                    <span>Accuracy: <span id="accuracy">100%</span></span>
                    <span>Time: <span id="timer">0</span>s</span>
                </div>
            </div>
        `;
        
        this.renderText();
        const input = document.getElementById('typing-input');
        input.addEventListener('input', () => this.handleInput());
        input.focus();
        
        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('timer').textContent = elapsed;
            this.updateWPM();
        }, 1000);
    }

    renderText() {
        const textDiv = document.getElementById('typing-text');
        let html = '';
        
        for (let i = 0; i < this.currentText.length; i++) {
            let char = this.currentText[i];
            if (i < this.currentIndex) {
                html += `<span class="char-correct">${char}</span>`;
            } else if (i === this.currentIndex) {
                html += `<span class="char-wrong">${char}</span>`;
            } else {
                html += char;
            }
        }
        
        textDiv.innerHTML = html;
    }

    handleInput() {
        const input = document.getElementById('typing-input');
        const value = input.value;
        
        if (value.length > this.userInput.length) {
            const newChar = value[value.length - 1];
            if (newChar === this.currentText[this.currentIndex]) {
                this.currentIndex++;
                this.userInput = value;
                
                if (this.currentIndex === this.currentText.length) {
                    this.complete();
                }
            }
        } else {
            this.userInput = value;
            this.currentIndex = value.length;
        }
        
        this.renderText();
        this.updateWPM();
    }

    updateWPM() {
        const elapsed = (Date.now() - this.startTime) / 60000; // minutes
        const wpm = Math.round((this.currentIndex / 5) / elapsed) || 0;
        const accuracy = Math.round((this.currentIndex / Math.max(this.userInput.length, 1)) * 100);
        
        document.getElementById('wpm').textContent = wpm;
        document.getElementById('accuracy').textContent = accuracy + '%';
    }

    complete() {
        clearInterval(this.timer);
        const elapsed = (Date.now() - this.startTime) / 1000;
        const wpm = Math.round((this.currentIndex / 5) / (elapsed / 60));
        const points = Math.round(wpm * 2);
        
        addScore(points);
        
        setTimeout(() => {
            alert(`Completed! WPM: ${wpm}, Time: ${Math.round(elapsed)}s`);
            saveGameSessionStats();
            increaseLevel();
            this.init();
        }, 500);
    }

    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}

// Puzzle Escape Game
class PuzzleGame {
    constructor(container) {
        this.container = container;
        this.size = 3;
        this.tiles = [];
        this.emptyIndex = 8;
        this.moves = 0;
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <h2>Puzzle Escape - Arrange the Tiles</h2>
            <p>Moves: <span id="puzzle-moves">0</span></p>
            <div class="puzzle-grid" id="puzzle-grid"></div>
            <button id="shuffle-puzzle" style="margin-top: 20px; padding: 10px 20px; font-size: 1em; background: rgba(0,0,0,0.1); border: 2px solid rgba(0,0,0,0.3); color: #000; border-radius: 8px; cursor: pointer;">Shuffle</button>
        `;
        
        this.createPuzzle();
        document.getElementById('shuffle-puzzle').addEventListener('click', () => this.shuffle());
    }

    createPuzzle() {
        const grid = document.getElementById('puzzle-grid');
        grid.innerHTML = '';
        this.tiles = [];
        
        for (let i = 0; i < this.size * this.size; i++) {
            const tile = document.createElement('div');
            if (i === this.size * this.size - 1) {
                tile.className = 'puzzle-piece empty';
                this.emptyIndex = i;
            } else {
                tile.className = 'puzzle-piece';
                tile.textContent = i + 1;
                tile.dataset.index = i;
                tile.addEventListener('click', () => this.moveTile(i));
            }
            grid.appendChild(tile);
            this.tiles.push(tile);
        }
        
        this.moves = 0;
        this.updateMoves();
    }

    moveTile(index) {
        const row = Math.floor(index / this.size);
        const col = index % this.size;
        const emptyRow = Math.floor(this.emptyIndex / this.size);
        const emptyCol = this.emptyIndex % this.size;
        
        if ((Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow)) {
            // Swap
            [this.tiles[index], this.tiles[this.emptyIndex]] = [this.tiles[this.emptyIndex], this.tiles[index]];
            
            const tempText = this.tiles[index].textContent;
            const tempClass = this.tiles[index].className;
            
            this.tiles[index].textContent = this.tiles[this.emptyIndex].textContent;
            this.tiles[index].className = this.tiles[this.emptyIndex].className;
            this.tiles[index].dataset.index = index;
            
            this.tiles[this.emptyIndex].textContent = '';
            this.tiles[this.emptyIndex].className = 'puzzle-piece empty';
            this.tiles[this.emptyIndex].dataset.index = this.emptyIndex;
            
            if (this.tiles[index].textContent) {
                this.tiles[index].addEventListener('click', () => this.moveTile(index));
            }
            this.tiles[this.emptyIndex].removeEventListener('click', () => {});
            
            this.emptyIndex = index;
            this.moves++;
            this.updateMoves();
            
            if (this.checkWin()) {
                setTimeout(() => {
                    alert(`Puzzle solved in ${this.moves} moves!`);
                    addScore(100 - this.moves);
                    saveGameSessionStats();
                    increaseLevel();
                    this.shuffle();
                }, 300);
            }
        }
    }

    updateMoves() {
        document.getElementById('puzzle-moves').textContent = this.moves;
    }

    checkWin() {
        for (let i = 0; i < this.tiles.length - 1; i++) {
            const tile = this.tiles[i];
            if (tile.textContent !== String(i + 1)) {
                return false;
            }
        }
        return true;
    }

    shuffle() {
        // Simple shuffle - make random valid moves
        for (let i = 0; i < 1000; i++) {
            const neighbors = this.getNeighbors();
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            this.moveTile(randomNeighbor);
        }
        this.moves = 0;
        this.updateMoves();
    }

    getNeighbors() {
        const neighbors = [];
        const row = Math.floor(this.emptyIndex / this.size);
        const col = this.emptyIndex % this.size;
        
        if (row > 0) neighbors.push(this.emptyIndex - this.size);
        if (row < this.size - 1) neighbors.push(this.emptyIndex + this.size);
        if (col > 0) neighbors.push(this.emptyIndex - 1);
        if (col < this.size - 1) neighbors.push(this.emptyIndex + 1);
        
        return neighbors;
    }

    cleanup() {
        // Cleanup if needed
    }
}

// Concentration Focus Game
class ConcentrationGame {
    constructor(container) {
        this.container = container;
        this.targetsClicked = 0;
        this.distractionsClicked = 0;
        this.timeLimit = 30;
        this.timeLeft = this.timeLimit;
        this.timer = null;
        this.targets = [];
        this.distractions = [];
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <h2>Concentration Focus - Click Only Green Targets</h2>
            <div class="concentration-game">
                <p>Time: <span id="time-left">${this.timeLeft}</span>s | Targets: <span id="targets-hit">0</span> | Distractions: <span id="distractions-hit">0</span></p>
                <div class="distraction-area" id="game-area"></div>
                <div class="concentration-stats">
                    <p>Focus on green targets only. Avoid distractions!</p>
                </div>
            </div>
        `;
        
        this.startGame();
    }

    startGame() {
        const gameArea = document.getElementById('game-area');
        this.targetsClicked = 0;
        this.distractionsClicked = 0;
        this.timeLeft = this.timeLimit + level * 5;
        document.getElementById('time-left').textContent = this.timeLeft;
        
        this.spawnTarget();
        this.spawnDistraction();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('time-left').textContent = this.timeLeft;
            
            if (Math.random() < 0.3) {
                this.spawnTarget();
            }
            
            if (Math.random() < 0.4) {
                this.spawnDistraction();
            }
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    spawnTarget() {
        const gameArea = document.getElementById('game-area');
        const target = document.createElement('div');
        target.className = 'target';
        target.textContent = '✓';
        
        const x = Math.random() * (gameArea.offsetWidth - 60);
        const y = Math.random() * (gameArea.offsetHeight - 60);
        target.style.left = x + 'px';
        target.style.top = y + 'px';
        
        target.addEventListener('click', () => {
            target.remove();
            this.targetsClicked++;
            document.getElementById('targets-hit').textContent = this.targetsClicked;
            addScore(5);
            
            if (this.targetsClicked % 10 === 0) {
                increaseLevel();
            }
        });
        
        gameArea.appendChild(target);
        this.targets.push(target);
        
        setTimeout(() => {
            if (target.parentNode) {
                target.remove();
                const index = this.targets.indexOf(target);
                if (index > -1) this.targets.splice(index, 1);
            }
        }, 2000);
    }

    spawnDistraction() {
        const gameArea = document.getElementById('game-area');
        const distraction = document.createElement('div');
        distraction.className = 'distraction';
        distraction.textContent = ['📱', '💻', '🎮', '📺'][Math.floor(Math.random() * 4)];
        
        const x = Math.random() * (gameArea.offsetWidth - 100);
        const y = Math.random() * (gameArea.offsetHeight - 30);
        distraction.style.left = x + 'px';
        distraction.style.top = y + 'px';
        
        distraction.addEventListener('click', () => {
            distraction.remove();
            this.distractionsClicked++;
            document.getElementById('distractions-hit').textContent = this.distractionsClicked;
            addScore(-10);
        });
        
        gameArea.appendChild(distraction);
        this.distractions.push(distraction);
        
        setTimeout(() => {
            if (distraction.parentNode) {
                distraction.remove();
                const index = this.distractions.indexOf(distraction);
                if (index > -1) this.distractions.splice(index, 1);
            }
        }, 3000);
    }

    endGame() {
        clearInterval(this.timer);
        const finalScore = this.targetsClicked * 5 - this.distractionsClicked * 10;
        
        setTimeout(() => {
            alert(`Time's up! Targets: ${this.targetsClicked}, Distractions: ${this.distractionsClicked}, Final Score: ${finalScore}`);
            saveGameSessionStats();
            this.init();
        }, 500);
    }

    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.targets.forEach(t => t.remove());
        this.distractions.forEach(d => d.remove());
    }
}

