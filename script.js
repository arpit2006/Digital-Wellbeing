// Simple localStorage auth (demo only)
const STORAGE_KEYS = {
  users: 'dw_users',
  session: 'dw_session_user'
};

function readUsers(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]'); } catch { return []; }
}
function writeUsers(users){
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}
function setSession(user){
  if (user){ localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ email:user.email, name:user.name })); }
}
function getSession(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null'); } catch { return null; }
}
function clearSession(){ localStorage.removeItem(STORAGE_KEYS.session); }

function getCurrentUser(){
  const session = getSession(); if (!session) return null;
  const users = readUsers();
  return users.find(u => u.email === session.email) || null;
}
function updateCurrentUser(mutator){
  const session = getSession(); if (!session) return;
  const users = readUsers();
  const idx = users.findIndex(u => u.email === session.email);
  if (idx === -1) return;
  const user = users[idx];
  const updated = mutator({ ...user });
  users[idx] = updated;
  writeUsers(users);
}

// Basic hash substitute (NOT secure; demo only)
function simpleHash(s){
  let h = 0; for (let i = 0; i < s.length; i++){ h = (h<<5) - h + s.charCodeAt(i); h |= 0; }
  return String(h);
}

// Nav state
function initAuthNav(){
  const navAuth = document.getElementById('nav-auth');
  const navLogout = document.getElementById('nav-logout');
  const navUsername = document.getElementById('nav-username');
  const session = getSession();
  if (session){
    if (navAuth) navAuth.classList.add('hidden');
    if (navLogout){
      navLogout.classList.remove('hidden');
      navLogout.addEventListener('click', () => { clearSession(); location.href = 'index.html'; });
    }
    if (navUsername){ navUsername.textContent = 'Hello, ' + (session.name || session.email); navUsername.classList.remove('hidden'); }
  } else {
    if (navAuth) navAuth.classList.remove('hidden');
    if (navLogout) navLogout.classList.add('hidden');
    if (navUsername) navUsername.classList.add('hidden');
  }
}

// Tabs on login/register
function initAuthTabs(){
  const tabs = document.querySelectorAll('.tab');
  const forms = document.querySelectorAll('.form');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      forms.forEach(f => f.classList.remove('is-active'));
      tab.classList.add('is-active');
      const target = tab.getAttribute('data-tab');
      const form = document.getElementById(target + 'Form');
      if (form) form.classList.add('is-active');
    });
  });
}

// Auth forms
function bindAuthForms(){
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');

  if (loginForm){
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;
      const users = readUsers();
      const user = users.find(u => u.email === email && u.passwordHash === simpleHash(password));
      if (!user){
        if (loginError) loginError.textContent = 'Invalid email or password.';
        return;
      }
      setSession(user);
      location.href = 'games.html';
    });
  }

  if (registerForm){
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim().toLowerCase();
      const password = document.getElementById('registerPassword').value;
      const users = readUsers();
      if (users.some(u => u.email === email)){
        if (registerError) registerError.textContent = 'An account with this email already exists.';
        return;
      }
      const newUser = { name, email, passwordHash: simpleHash(password), createdAt: Date.now() };
      users.push(newUser);
      writeUsers(users);
      setSession(newUser);
      location.href = 'games.html';
    });
  }
}

// Gate content on games page
function gateContent(){
  const session = getSession();
  const gate = document.getElementById('gate');
  const content = document.getElementById('content');
  const userName = document.getElementById('userName');
  if (session){
    if (gate) gate.classList.add('hidden');
    if (content) content.classList.remove('hidden');
    if (userName) userName.textContent = session.name || session.email;
    renderProfile();
  } else {
    if (gate) gate.classList.remove('hidden');
    if (content) content.classList.add('hidden');
  }
}

// Profile progress UI
function ensureProgressShape(u){
  if (!u.progress) u.progress = {};
  const p = u.progress;
  if (typeof p.gamesPlayed !== 'number') p.gamesPlayed = 0;
  if (typeof p.bestReactionMs !== 'number') p.bestReactionMs = Infinity;
  if (typeof p.quizzesTaken !== 'number') p.quizzesTaken = 0;
  if (typeof p.lastQuizScore !== 'number') p.lastQuizScore = 0;
  if (!Array.isArray(p.reactionHistoryMs)) p.reactionHistoryMs = [];
  if (!Array.isArray(p.quizScores)) p.quizScores = [];
  if (!Array.isArray(p.quizScoresPct)) p.quizScoresPct = [];
  if (!p.gamesById) p.gamesById = {};
  if (!Array.isArray(p.quizHistory)) p.quizHistory = [];
  return u;
}
function renderProfile(){
  const user = getCurrentUser();
  if (!user) return;
  ensureProgressShape(user);
  const gamesPlayed = document.getElementById('statGamesPlayed');
  const bestReaction = document.getElementById('statBestReaction');
  const quizzes = document.getElementById('statQuizzes');
  const lastScore = document.getElementById('statLastScore');
  if (gamesPlayed) gamesPlayed.textContent = String(user.progress.gamesPlayed);
  if (bestReaction) bestReaction.textContent = (user.progress.bestReactionMs === Infinity) ? '—' : (user.progress.bestReactionMs + ' ms');
  if (quizzes) quizzes.textContent = String(user.progress.quizzesTaken);
  if (lastScore) lastScore.textContent = user.progress.lastQuizScore ? String(user.progress.lastQuizScore) : '—';

  // Optional per-game list if container exists
  const perGameList = document.getElementById('statPerGame');
  if (perGameList){
    perGameList.innerHTML = '';
    const entries = Object.entries(user.progress.gamesById || {});
    if (!entries.length){
      const li = document.createElement('li'); li.className='muted'; li.textContent='No external game plays yet.'; perGameList.appendChild(li);
    } else {
      entries.forEach(([id,info])=>{
        const li = document.createElement('li');
        const name = info.name || id;
        const count = info.count || 0;
        li.innerHTML = '<span>'+name+'</span><strong>'+count+'</strong>';
        perGameList.appendChild(li);
      });
    }
  }
}

// Slideshow
let slideTimer = null;
function initSlideshow(){
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dots = document.getElementById('dots');
  const prev = document.getElementById('prevSlide');
  const next = document.getElementById('nextSlide');
  if (!slides.length || !dots) return;

  let index = 0;
  function render(){
    slides.forEach((s,i)=> s.classList.toggle('is-active', i===index));
    Array.from(dots.children).forEach((d,i)=> d.setAttribute('aria-selected', i===index ? 'true':'false'));
  }
  function go(to){ index = (to + slides.length) % slides.length; render(); }
  function startAuto(){ stopAuto(); slideTimer = setInterval(()=> go(index+1), 4500); }
  function stopAuto(){ if (slideTimer){ clearInterval(slideTimer); slideTimer = null; } }

  // Dots
  slides.forEach((_,i)=>{
    const b = document.createElement('button');
    b.setAttribute('role','tab');
    b.setAttribute('aria-label','Go to slide ' + (i+1));
    b.addEventListener('click', ()=> { go(i); startAuto(); });
    dots.appendChild(b);
  });

  // Controls
  if (prev) prev.addEventListener('click', ()=> { go(index-1); startAuto(); });
  if (next) next.addEventListener('click', ()=> { go(index+1); startAuto(); });

  render();
  startAuto();
}

// Reaction Timer
function bindReaction(){
  const box = document.getElementById('reactionBox');
  const start = document.getElementById('reactionStart');
  const status = document.getElementById('reactionStatus');
  const result = document.getElementById('reactionResult');
  if (!box || !start) return;
  let readyAt = 0; let timeoutId = null; let started = false; let clicked = false;

  function reset(){
    started = false; clicked = false; readyAt = 0; result.textContent = '';
    box.classList.remove('ready','wait'); box.textContent = 'Wait for green…';
    status.textContent = 'Press Start to begin.'; if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
  }
  reset();

  function begin(){
    reset();
    started = true; box.classList.add('wait'); status.textContent = 'Wait…';
    const delay = 800 + Math.random()*2200;
    timeoutId = setTimeout(()=>{ box.classList.remove('wait'); box.classList.add('ready'); box.textContent = 'CLICK!'; status.textContent = 'Now!'; readyAt = performance.now(); }, delay);
  }

  start.addEventListener('click', begin);
  box.addEventListener('click', handleClick);
  box.addEventListener('keydown', (e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); handleClick(); }});

  function handleClick(){
    if (!started) return; if (clicked) return; clicked = true;
    if (!readyAt){ result.textContent = 'Too soon!'; status.textContent = 'Try again with patience.'; reset(); return; }
    const rt = Math.round(performance.now() - readyAt);
    result.textContent = rt + ' ms'; status.textContent = 'Great job!';
    // Update stats
    updateCurrentUser((u)=>{
      u = ensureProgressShape(u);
      u.progress.gamesPlayed += 1;
      if (rt < u.progress.bestReactionMs) u.progress.bestReactionMs = rt;
      u.progress.reactionHistoryMs.push(rt);
      if (u.progress.reactionHistoryMs.length > 10) u.progress.reactionHistoryMs = u.progress.reactionHistoryMs.slice(-10);
      return u;
    });
    renderProfile();
  }
}

// Typing Challenge
function bindTyping(){
  const start = document.getElementById('typingStart');
  const input = document.getElementById('typingInput');
  const wordLabel = document.getElementById('typingWord');
  const result = document.getElementById('typingResult');
  if (!start || !input || !wordLabel) return;
  const words = ['presence','balance','focus','mindful','disconnect','attention','breathe'];
  let current = '';
  let rounds = 0; let startTime = 0; let totalMs = 0;
  function nextRound(){
    current = words[Math.floor(Math.random()*words.length)];
    wordLabel.textContent = current;
    input.value = '';
    input.focus();
    startTime = performance.now();
  }
  function done(){
    const avg = Math.round(totalMs / 3);
    result.textContent = 'Average: ' + avg + ' ms';
    updateCurrentUser((u)=>{ u = ensureProgressShape(u); u.progress.gamesPlayed += 1; return u; });
    renderProfile();
  }
  start.addEventListener('click', ()=>{ rounds = 0; totalMs = 0; result.textContent = ''; nextRound(); });
  input.addEventListener('input', ()=>{
    if (!current) return;
    if (input.value.trim().toLowerCase() === current){
      const ms = Math.round(performance.now() - startTime);
      totalMs += ms; rounds += 1;
      if (rounds >= 3){ current = ''; done(); }
      else { nextRound(); }
    }
  });
}

// Memory Match (6 cards -> 3 pairs)
function bindMemory(){
  const grid = document.getElementById('memoryGrid');
  const btn = document.getElementById('memoryStart');
  const status = document.getElementById('memoryStatus');
  if (!grid || !btn) return;
  let first = null, second = null, lock = false, matches = 0, moves = 0;
  let values = [];
  function shuffle(arr){ for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
  function setup(){
    grid.innerHTML=''; first=second=null; lock=false; matches=0; moves=0; status.textContent='';
    values = shuffle([1,1,2,2,3,3]);
    values.forEach((v,idx)=>{
      const d = document.createElement('button');
      d.type='button';
      d.className='cardm';
      d.setAttribute('data-v', String(v));
      d.addEventListener('click', ()=> flip(d));
      d.textContent='?';
      grid.appendChild(d);
    });
  }
  function flip(card){
    if (lock || card.classList.contains('matched') || card===first) return;
    card.classList.add('revealed');
    card.textContent = card.getAttribute('data-v');
    if (!first){ first = card; return; }
    second = card; lock = true; moves += 1;
    const v1 = first.getAttribute('data-v');
    const v2 = second.getAttribute('data-v');
    if (v1 === v2){
      first.classList.add('matched');
      second.classList.add('matched');
      first = second = null; lock = false; matches += 1;
      if (matches === 3){
        status.textContent = 'Solved in ' + moves + ' moves';
        updateCurrentUser((u)=>{ u = ensureProgressShape(u); u.progress.gamesPlayed += 1; return u; });
        renderProfile();
      }
    } else {
      setTimeout(()=>{
        first.classList.remove('revealed'); first.textContent='?';
        second.classList.remove('revealed'); second.textContent='?';
        first = second = null; lock = false;
      }, 700);
    }
  }
  btn.addEventListener('click', setup);
  // auto setup on load for convenience
  setup();
}

// Quiz scoring (Likert 1-4)
function bindQuiz(){
  const form = document.getElementById('quizForm');
  const ageForm = document.getElementById('ageForm');
  const resultContainer = document.getElementById('quizResult');
  const scorePercentageEl = document.getElementById('scorePercentage');
  const scoreFractionEl = document.getElementById('scoreFraction');
  const quizMessageEl = document.getElementById('quizMessage');
  const quizDetailsEl = document.getElementById('quizDetails');
  const retakeBtn = document.getElementById('retakeQuiz');
  const shareBtn = document.getElementById('shareResults');
  const scoreCircleProgress = document.getElementById('scoreCircleProgress');
  const recommendationsEl = document.getElementById('quizRecommendations');
  const recommendationsList = document.getElementById('recommendationsList');
  const quizStats = document.getElementById('quizStats');
  const statQuestions = document.getElementById('statQuestions');
  const statAverage = document.getElementById('statAverage');
  const statRiskLevel = document.getElementById('statRiskLevel');
  if (!form) return;

  const banks = {
    kid: [
      'I talk to family during meals instead of using devices.',
      'I stop using screens at least 1 hour before bedtime.',
      'I can put the tablet/phone away when asked.',
      'I like to play outside or read without screens.',
      'I watch videos that are right for my age.'
    ],
    teen: [
      'My screen time doesn’t hurt my sleep or grades.',
      'I can resist doomscrolling and set app limits.',
      'I put my phone away during study or with friends.',
      'Social media doesn’t make me feel worse about myself.',
      'I take breaks from screens each day.'
    ],
    adult: [
      'I maintain focus without constant notification checks.',
      'My phone use doesn’t disrupt sleep or relationships.',
      'I set boundaries (work hours, tech-free spaces).',
      'I use my phone intentionally rather than habitually.',
      'I replace scrolling with restorative activities.'
    ]
  };

  // Single-question flow
  let currentGroup = null;
  let questions = [];
  let stepIndex = 0;
  let answers = [];

  function renderStep(){
    if (!questions.length) return;
    form.innerHTML = '';
    const wrapper = document.createElement('div');
    const progress = document.createElement('p');
    progress.className = 'muted';
    progress.textContent = 'Question ' + (stepIndex+1) + ' / ' + questions.length;
    wrapper.appendChild(progress);
    const qEl = document.createElement('div');
    const span = document.createElement('span'); span.className='question fade-in'; span.textContent = questions[stepIndex]; qEl.appendChild(span);
    const choices = document.createElement('div'); choices.className = 'choices';
    const labels = ['Never','Rarely','Sometimes','Often'];
    labels.forEach((label,i)=>{
      const l = document.createElement('label');
      const input = document.createElement('input'); input.type='radio'; input.name = 'ans'; input.value = String(i+1); if (i===0) input.required = true;
      l.appendChild(input); l.appendChild(document.createTextNode(' ' + label));
      choices.appendChild(l);
    });
    qEl.appendChild(choices);
    wrapper.appendChild(qEl);
    const btn = document.createElement('button'); btn.className='cta'; btn.type='submit'; btn.textContent = (stepIndex === questions.length-1) ? 'Finish' : 'Next';
    wrapper.appendChild(btn);
    form.appendChild(wrapper);
    form.style.display = '';

    // update progress bar
    const bar = document.getElementById('quizProgress');
    if (bar){
      const pct = Math.round(((stepIndex) / questions.length) * 100);
      bar.style.width = pct + '%';
    }
  }

  if (ageForm){
    ageForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = new FormData(ageForm);
      const group = data.get('ageGroup');
      if (!group) return;
      currentGroup = String(group);
      questions = banks[currentGroup].slice();
      stepIndex = 0; answers = [];
      if (resultContainer) resultContainer.style.display = 'none';
      renderStep();
    });
  }

  // Retake quiz button
  if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
      if (resultContainer) resultContainer.style.display = 'none';
      if (ageForm) ageForm.style.display = '';
      if (recommendationsEl) recommendationsEl.style.display = 'none';
      if (quizStats) quizStats.style.display = 'none';
      stepIndex = 0;
      answers = [];
      questions = [];
      currentGroup = null;
      const bar = document.getElementById('quizProgress');
      if (bar) bar.style.width = '0%';
    });
  }

  // Share results button
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const user = getCurrentUser();
      if (!user || !user.progress.lastQuizScore) return;
      
      const pct = user.progress.quizScoresPct && user.progress.quizScoresPct.length > 0 
        ? user.progress.quizScoresPct[user.progress.quizScoresPct.length - 1] 
        : 0;
      
      let shareText = `🎯 Digital Well-Being Quiz Results: ${pct}%\n\n`;
      if (pct <= 25) {
        shareText += '✨ Excellent! I have healthy digital habits!\n';
      } else if (pct <= 60) {
        shareText += '👍 Good! Working on improving my digital wellness.\n';
      } else {
        shareText += '📱 Taking steps to improve my digital habits!\n';
      }
      shareText += '\nTake the quiz: Digital Well-Being Assessment';
      
      if (navigator.share) {
        navigator.share({
          title: 'Digital Well-Being Quiz Results',
          text: shareText
        }).catch(() => {
          copyToClipboard(shareText);
        });
      } else {
        copyToClipboard(shareText);
      }
    });
  }

  // Copy to clipboard helper
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        if (shareBtn) {
          const originalText = shareBtn.textContent;
          shareBtn.textContent = '✓ Copied!';
          setTimeout(() => {
            shareBtn.textContent = originalText;
          }, 2000);
        }
      });
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      if (shareBtn) {
        const originalText = shareBtn.textContent;
        shareBtn.textContent = '✓ Copied!';
        setTimeout(() => {
          shareBtn.textContent = originalText;
        }, 2000);
      }
    }
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = new FormData(form);
    const val = Number(data.get('ans')||0);
    if (!val) return; // required ensures selection
    answers.push(val);
    if (stepIndex < questions.length - 1){
      stepIndex += 1;
      renderStep();
      return;
    }
    // finished
    const count = answers.length;
    const sum = answers.reduce((a,b)=>a+b,0);
    const min = 1*count, max = 4*count;
    const pct = Math.round(((sum - min) / (max - min)) * 100);
    
    // Determine category and styling
    let category, msg, icon, details, categoryClass, recommendations, riskLevel;
    const averageResponse = (sum / count).toFixed(1);
    
    if (pct <= 25) {
      category = 'Excellent';
      categoryClass = 'excellent';
      msg = '🎉 Excellent! Low Risk';
      icon = '✨';
      details = 'You have healthy digital habits! Keep maintaining this balance and continue being mindful of your screen time.';
      riskLevel = 'Low';
      recommendations = [
        'Continue maintaining healthy screen time boundaries',
        'Keep using tech-free zones during meals and bedtime',
        'Stay mindful of your digital habits',
        'Share your healthy habits with others'
      ];
    } else if (pct <= 60) {
      category = 'Good';
      categoryClass = 'good';
      msg = '👍 Good! Moderate Risk';
      icon = '💡';
      details = 'You\'re on the right track! Consider adding some gentle limits and screen-free zones to further improve your digital well-being.';
      riskLevel = 'Moderate';
      recommendations = [
        'Set specific screen-free times (meals, 1 hour before bed)',
        'Use app timers to track and limit usage',
        'Create tech-free zones in your home',
        'Take regular breaks from screens every hour',
        'Try the Pomodoro Technique for focused work'
      ];
    } else {
      category = 'Needs Improvement';
      categoryClass = 'needs-improvement';
      msg = '📱 Needs Attention';
      icon = '🔔';
      details = 'Consider establishing structured routines, setting screen time limits, and creating tech-free zones. Small changes can make a big difference!';
      riskLevel = 'High';
      recommendations = [
        'Establish a strict bedtime routine without devices',
        'Set daily screen time limits using built-in phone features',
        'Create physical boundaries: no phones in bedroom',
        'Practice the 20-20-20 rule: every 20 minutes, look 20 feet away for 20 seconds',
        'Schedule regular tech-free activities (reading, exercise, hobbies)',
        'Consider using focus apps that block distractions',
        'Join a digital wellness challenge or support group'
      ];
    }

    // Update result display with animations
    if (resultContainer && scorePercentageEl && scoreFractionEl && quizMessageEl && quizDetailsEl) {
      // Clear previous content
      scorePercentageEl.textContent = '';
      scoreFractionEl.textContent = '';
      quizMessageEl.textContent = '';
      quizDetailsEl.textContent = '';
      if (recommendationsList) recommendationsList.innerHTML = '';
      
      // Remove previous category classes
      scorePercentageEl.className = 'score-percentage';
      quizMessageEl.className = 'quiz-message';
      if (scoreCircleProgress) scoreCircleProgress.className = 'score-circle-progress';
      
      // Add category class
      scorePercentageEl.classList.add(categoryClass);
      quizMessageEl.classList.add(categoryClass);
      if (scoreCircleProgress) scoreCircleProgress.classList.add(categoryClass);
      
      // Animate circular progress
      if (scoreCircleProgress) {
        const circumference = 2 * Math.PI * 54; // 339.292
        const offset = circumference - (pct / 100) * circumference;
        scoreCircleProgress.style.strokeDashoffset = circumference.toString();
        setTimeout(() => {
          scoreCircleProgress.style.strokeDashoffset = offset.toString();
        }, 200);
      }
      
      // Animate score counting up
      let currentPct = 0;
      const animateScore = () => {
        if (currentPct <= pct) {
          scorePercentageEl.textContent = currentPct + '%';
          currentPct += 2;
          setTimeout(animateScore, 30);
        } else {
          scorePercentageEl.textContent = pct + '%';
          // Trigger confetti for excellent scores
          if (pct <= 25) {
            triggerConfetti();
          }
        }
      };
      animateScore();
      
      // Set fraction and message
      scoreFractionEl.textContent = sum + ' / ' + max + ' points';
      quizMessageEl.innerHTML = '<span class="quiz-icon">' + icon + '</span><br>' + msg;
      quizDetailsEl.textContent = details;
      
      // Show recommendations
      if (recommendationsEl && recommendationsList && recommendations) {
        recommendations.forEach(rec => {
          const li = document.createElement('li');
          li.textContent = rec;
          recommendationsList.appendChild(li);
        });
        recommendationsEl.style.display = 'block';
      }
      
      // Show statistics
      if (quizStats && statQuestions && statAverage && statRiskLevel) {
        statQuestions.textContent = count;
        statAverage.textContent = averageResponse;
        statRiskLevel.textContent = riskLevel;
        quizStats.style.display = 'grid';
      }
      
      // Show result container
      resultContainer.style.display = 'block';
      
      // Scroll to result
      setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
    
    updateCurrentUser((u)=>{
      u = ensureProgressShape(u);
      u.progress.quizzesTaken += 1;
      u.progress.lastQuizScore = sum;
      u.progress.quizScores.push(sum);
      if (!Array.isArray(u.progress.quizScoresPct)) u.progress.quizScoresPct = [];
      u.progress.quizScoresPct.push(pct);
      if (!Array.isArray(u.progress.quizHistory)) u.progress.quizHistory = [];
      u.progress.quizHistory.push({ group: currentGroup, sum, max, pct, t: Date.now() });
      if (u.progress.quizScores.length > 10) u.progress.quizScores = u.progress.quizScores.slice(-10);
      if (u.progress.quizScoresPct.length > 10) u.progress.quizScoresPct = u.progress.quizScoresPct.slice(-10);
      if (u.progress.quizHistory.length > 10) u.progress.quizHistory = u.progress.quizHistory.slice(-10);
      return u;
    });
    renderProfile();
    form.style.display = 'none';
    if (ageForm) ageForm.style.display = 'none';
    const bar = document.getElementById('quizProgress'); if (bar) bar.style.width = '100%';
  });
}

// Dashboard rendering
function renderDashboard(){
  const user = getCurrentUser();
  if (!user) return;
  ensureProgressShape(user);
  const p = user.progress;
  const ovGames = document.getElementById('ovGames');
  const ovBest = document.getElementById('ovBest');
  const ovAvg = document.getElementById('ovAvg');
  const ovQuizzes = document.getElementById('ovQuizzes');
  const ovLastScore = document.getElementById('ovLastScore');
  if (ovGames) ovGames.textContent = String(p.gamesPlayed);
  if (ovBest) ovBest.textContent = (p.bestReactionMs === Infinity) ? '—' : (p.bestReactionMs + ' ms');
  if (ovQuizzes) ovQuizzes.textContent = String(p.quizzesTaken);
  if (ovLastScore) ovLastScore.textContent = p.lastQuizScore ? String(p.lastQuizScore) : '—';

  const rh = p.reactionHistoryMs;
  const qb = p.quizScores;
  const qbPct = p.quizScoresPct;
  const reactionBars = document.getElementById('reactionBars');
  const quizBars = document.getElementById('quizBars');
  const reactionEmpty = document.getElementById('reactionEmpty');
  const quizEmpty = document.getElementById('quizEmpty');

  if (reactionBars){ reactionBars.innerHTML = ''; }
  if (quizBars){ quizBars.innerHTML = ''; }

  if (rh && rh.length){
    if (reactionEmpty) reactionEmpty.style.display = 'none';
    const max = Math.max(...rh);
    rh.forEach((v,i)=>{
      const bar = document.createElement('div');
      bar.className = 'bar';
      const height = Math.max(8, Math.round((v / max) * 100));
      bar.style.height = height + '%';
      bar.setAttribute('data-label', v + 'ms');
      reactionBars.appendChild(bar);
    });
    const avg = Math.round(rh.reduce((a,b)=>a+b,0)/rh.length);
    if (ovAvg) ovAvg.textContent = String(avg) + ' ms';
  } else {
    if (reactionEmpty) reactionEmpty.style.display = '';
    if (ovAvg) ovAvg.textContent = '—';
  }

  if ((qbPct && qbPct.length) || (qb && qb.length)){
    if (quizEmpty) quizEmpty.style.display = 'none';
    const arr = (qbPct && qbPct.length) ? qbPct : qb.map(v=> Math.round((v/20)*100));
    arr.forEach((v,i)=>{
      const bar = document.createElement('div');
      bar.className = 'bar';
      const height = Math.max(8, Math.round(v));
      bar.style.height = height + '%';
      bar.setAttribute('data-label', String(v) + '%');
      quizBars.appendChild(bar);
    });
  } else {
    if (quizEmpty) quizEmpty.style.display = '';
  }
  // Quiz history list
  const hist = p.quizHistory || [];
  const list = document.getElementById('quizHistory');
  const empty = document.getElementById('quizHistoryEmpty');
  if (list){
    list.innerHTML = '';
    if (!hist.length){ if (empty) empty.style.display=''; }
    else {
      if (empty) empty.style.display='none';
      hist.slice(-10).reverse().forEach(item=>{
        const li = document.createElement('li');
        const when = new Date(item.t).toLocaleString();
        li.innerHTML = '<span>'+ (item.group||'quiz') + ' — ' + item.sum + '/' + item.max + ' (' + item.pct + '%)</span><small>'+when+'</small>';
        list.appendChild(li);
      });
    }
  }
  // External games report
  const gamesList = document.getElementById('extGamesList');
  const gamesEmpty = document.getElementById('extGamesEmpty');
  if (gamesList){
    gamesList.innerHTML = '';
    const entries = Object.entries(p.gamesById || {});
    if (!entries.length){ if (gamesEmpty) gamesEmpty.style.display=''; }
    else {
      if (gamesEmpty) gamesEmpty.style.display='none';
      entries.forEach(([id,g])=>{
        const li = document.createElement('li');
        const parts = [];
        parts.push((g.name || id));
        parts.push('plays: ' + (g.count || 0));
        if (typeof g.bestScore === 'number') parts.push('best score: ' + g.bestScore);
        if (typeof g.bestTimeMs === 'number') parts.push('best time: ' + g.bestTimeMs + ' ms');
        li.innerHTML = '<span>'+parts.join(' — ')+'</span>';
        gamesList.appendChild(li);
      });
    }
  }
}

// Generic game progress API for external HTML5 games
// Usage inside a game page (same origin):
// <script src="../script.js"></script>
// <script> window.DW.recordGameResult({ gameId:'my-game', name:'My Game', count:1, bestTimeMs:1234 }); </script>
if (!window.DW){ window.DW = {}; }
window.DW.recordGameResult = function(result){
  // result: { gameId: string, name?: string, count?: number, bestTimeMs?: number, bestScore?: number }
  if (!result || !result.gameId) return;
  updateCurrentUser((u)=>{
    u = ensureProgressShape(u);
    const id = result.gameId;
    if (!u.progress.gamesById[id]) u.progress.gamesById[id] = { count:0, name: result.name || id };
    const g = u.progress.gamesById[id];
    g.name = result.name || g.name || id;
    g.count = (g.count || 0) + (result.count || 1);
    // Track best metrics if provided
    if (typeof result.bestTimeMs === 'number'){
      if (typeof g.bestTimeMs !== 'number' || result.bestTimeMs < g.bestTimeMs){ g.bestTimeMs = result.bestTimeMs; }
    }
    if (typeof result.bestScore === 'number'){
      if (typeof g.bestScore !== 'number' || result.bestScore > g.bestScore){ g.bestScore = result.bestScore; }
    }
    // Also increment overall gamesPlayed
    u.progress.gamesPlayed += (result.count || 1);
    return u;
  });
  renderProfile();
};

// External games config and rendering
window.DW_GAMES = window.DW_GAMES || [
  // Example entries (edit or replace with your own):
  // { id: 'snake', name: 'Snake', href: 'games/snake/index.html' },
  // { id: 'tetris', name: 'Tetris', href: 'games/tetris/index.html' },
];
function renderExternalGames(){
  const list = document.getElementById('externalGames');
  if (!list) return;
  list.innerHTML = '';
  const items = window.DW_GAMES || [];
  if (!items.length){
    const li = document.createElement('li'); li.className='muted'; li.textContent='No games configured yet.'; list.appendChild(li);
    return;
  }
  items.forEach((g)=>{
    const li = document.createElement('li');
    const a = document.createElement('a'); a.href = g.href; a.target = '_blank'; a.rel='noopener'; a.textContent = g.name || g.id;
    li.appendChild(a);
    list.appendChild(li);
  });
}

// Reviews storage & UI
const REVIEWS_KEY = 'dw_reviews';
function readReviews(){
  try { return JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]'); } catch { return []; }
}
function writeReviews(arr){ localStorage.setItem(REVIEWS_KEY, JSON.stringify(arr)); }
function renderReviews(){
  const list = document.getElementById('reviewsList');
  if (!list) return;
  const reviews = readReviews().slice(-12).reverse();
  list.innerHTML = '';
  if (!reviews.length){
    const d = document.createElement('div'); d.className='muted'; d.textContent='No reviews yet. Be the first to share.'; list.appendChild(d); return;
  }
  reviews.forEach(r=>{
    const card = document.createElement('div'); card.className='review-card';
    const meta = document.createElement('div'); meta.className='meta';
    const who = document.createElement('span'); who.textContent = r.name || 'Anonymous';
    const when = document.createElement('span'); when.textContent = new Date(r.t).toLocaleDateString();
    meta.appendChild(who); meta.appendChild(when);
    const stars = document.createElement('div'); stars.className='stars'; stars.textContent = '★★★★★'.slice(0, r.rating) + '☆☆☆☆☆'.slice(0, 5 - r.rating);
    const txt = document.createElement('p'); txt.textContent = r.text;
    card.appendChild(meta); card.appendChild(stars); card.appendChild(txt);
    list.appendChild(card);
  });
}
function initReviewsUI(){
  renderReviews();
  const wrap = document.getElementById('reviewFormWrap');
  const form = document.getElementById('reviewForm');
  const msg = document.getElementById('reviewMsg');
  const hint = document.getElementById('reviewLoginHint');
  const session = getSession();
  if (!wrap) return;
  if (!session){
    if (form) form.classList.add('hidden');
    if (hint) hint.classList.remove('hidden');
    return;
  }
  if (hint) hint.classList.add('hidden');
  if (!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const rating = Number(document.getElementById('reviewRating').value || 0);
    const text = String(document.getElementById('reviewText').value || '').trim();
    if (!rating || !text){ if (msg) msg.textContent = 'Please provide a rating and a short comment.'; return; }
    const user = getCurrentUser();
    const entry = { name: (user?.name || user?.email || 'Anonymous'), rating, text, t: Date.now() };
    const arr = readReviews(); arr.push(entry); writeReviews(arr);
    if (msg) msg.textContent = 'Thanks for sharing!';
    (document.getElementById('reviewText')).value = '';
    (document.getElementById('reviewRating')).value = '';
    renderReviews();
  });
}

// FAQ toggle
function initFAQ(){
  const list = document.getElementById('faqList');
  if (!list) return;
  list.querySelectorAll('.faq-item .faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const answer = btn.parentElement.querySelector('.faq-a');
      if (answer){
        if (expanded){ answer.hidden = true; }
        else { answer.hidden = false; }
      }
    });
  });
}

// Tips (daily deterministic rotation)
const TIPS = [
  'Set app limits for the two biggest time sinks.',
  'Charge your phone outside the bedroom to improve sleep.',
  'Create a tech-free zone at meals.',
  'Turn off non-essential notifications for 24 hours.',
  'Ask “Why am I opening my phone?” before you unlock.',
  'Schedule a 10-minute scroll window, not all day.',
  'Move distracting apps off your home screen.'
];
function initDailyTip(){
  const el = document.getElementById('tipCard'); if (!el) return;
  const dayIndex = Math.floor(Date.now() / (1000*60*60*24)) % TIPS.length;
  el.textContent = TIPS[dayIndex];
}

// Dashboard: Check-ins, Pomodoro, Habits, Export/Reset
function ensureDashShape(u){
  ensureProgressShape(u);
  const p = u.progress;
  if (!p.checkins) p.checkins = { last: null, streak: 0, weeklyGoal: 3, badges: [] };
  if (!Array.isArray(p.focusLogs)) p.focusLogs = [];
  if (!Array.isArray(p.habits)) p.habits = [
    { name: 'No phone at meals', week: [0,0,0,0,0,0,0] },
    { name: '1-hr pre-sleep no screens', week: [0,0,0,0,0,0,0] },
    { name: 'Daily 10-min walk', week: [0,0,0,0,0,0,0] }
  ];
  return u;
}
function sameDay(a,b){ if (!a||!b) return false; const da=new Date(a), db=new Date(b); return da.getFullYear()===db.getFullYear() && da.getMonth()===db.getMonth() && da.getDate()===db.getDate(); }
function dayOfWeek(ts){ return new Date(ts).getDay(); }

function initDashboardExtras(){
  const session = getSession(); if (!session) return;
  // Check-in
  const btn = document.getElementById('checkInBtn');
  const streakOut = document.getElementById('streakCount');
  const goalOut = document.getElementById('weeklyGoal');
  const badgeOut = document.getElementById('badgeList');
  if (btn){
    btn.addEventListener('click', ()=>{
      updateCurrentUser(u=>{
        u = ensureDashShape(u);
        const now = Date.now();
        if (sameDay(u.progress.checkins.last, now)) return u; // already checked
        // compute yesterday to maintain streak
        const y = new Date(now); y.setDate(y.getDate()-1);
        const isYesterday = sameDay(u.progress.checkins.last, y.getTime());
        u.progress.checkins.streak = isYesterday ? (u.progress.checkins.streak+1) : 1;
        u.progress.checkins.last = now;
        // badges
        const s = u.progress.checkins.streak;
        if (s===3 && !u.progress.checkins.badges.includes('3-day')) u.progress.checkins.badges.push('3-day');
        if (s===7 && !u.progress.checkins.badges.includes('7-day')) u.progress.checkins.badges.push('7-day');
        if (s===14 && !u.progress.checkins.badges.includes('14-day')) u.progress.checkins.badges.push('14-day');
        return u;
      });
      renderDashboardExtras();
    });
  }

  // Focus timer
  const startBtn = document.getElementById('focusStart');
  const stopBtn = document.getElementById('focusStop');
  const minsInput = document.getElementById('focusMinutes');
  const display = document.getElementById('focusDisplay');
  let timerId = null; let endAt = 0;
  function tick(){
    const remain = Math.max(0, Math.round((endAt - Date.now())/1000));
    const mm = String(Math.floor(remain/60)).padStart(2,'0');
    const ss = String(remain%60).padStart(2,'0');
    if (display) display.textContent = mm+':'+ss;
    if (remain<=0){
      clearInterval(timerId); timerId=null;
      updateCurrentUser(u=>{ u=ensureDashShape(u); u.progress.focusLogs.push({ m:Number(minsInput.value||25), t:Date.now() }); if (u.progress.focusLogs.length>10) u.progress.focusLogs=u.progress.focusLogs.slice(-10); return u; });
      renderDashboardExtras();
    }
  }
  if (startBtn) startBtn.addEventListener('click', ()=>{ const m = Math.max(1, Math.min(120, Number(minsInput.value||25))); endAt = Date.now()+m*60000; if (timerId) clearInterval(timerId); timerId=setInterval(tick, 250); tick(); });
  if (stopBtn) stopBtn.addEventListener('click', ()=>{ if (timerId){ clearInterval(timerId); timerId=null; if (display) display.textContent = '00:00'; } });

  // Habits
  const habitsRoot = document.getElementById('habits');
  if (habitsRoot){
    habitsRoot.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-habit]');
      if (!btn) return;
      const hi = Number(btn.getAttribute('data-habit'));
      const di = Number(btn.getAttribute('data-day'));
      updateCurrentUser(u=>{ u=ensureDashShape(u); u.progress.habits[hi].week[di] = u.progress.habits[hi].week[di] ? 0 : 1; return u; });
      renderDashboardExtras();
    });
  }
  const resetWeek = document.getElementById('habitsResetWeek');
  if (resetWeek) resetWeek.addEventListener('click', ()=>{ updateCurrentUser(u=>{ u=ensureDashShape(u); u.progress.habits.forEach(h=>h.week=[0,0,0,0,0,0,0]); return u; }); renderDashboardExtras(); });

  // Export/Reset
  const exportBtn = document.getElementById('exportData');
  const resetBtn = document.getElementById('resetData');
  if (exportBtn) exportBtn.addEventListener('click', ()=>{
    const user = getCurrentUser(); if (!user) return;
    const data = JSON.stringify(user, null, 2);
    const blob = new Blob([data], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'digital-wellbeing-data.json'; a.click(); URL.revokeObjectURL(url);
  });
  if (resetBtn) resetBtn.addEventListener('click', ()=>{
    if (!confirm('This will clear your local data on this device. Continue?')) return;
    localStorage.clear(); location.reload();
  });

  renderDashboardExtras();
}

function renderDashboardExtras(){
  const user = getCurrentUser(); if (!user) return; ensureDashShape(user);
  const { checkins, focusLogs, habits } = user.progress;
  const streakOut = document.getElementById('streakCount'); if (streakOut) streakOut.textContent = String(checkins.streak||0);
  const goalOut = document.getElementById('weeklyGoal'); if (goalOut) goalOut.textContent = String(checkins.weeklyGoal||3);
  const badgeOut = document.getElementById('badgeList'); if (badgeOut) badgeOut.textContent = (checkins.badges&&checkins.badges.length)? checkins.badges.join(', ') : '—';
  // focus logs
  const logs = document.getElementById('focusLogs'); if (logs){ logs.innerHTML=''; (focusLogs||[]).slice(-5).reverse().forEach(l=>{ const li=document.createElement('li'); const when=new Date(l.t).toLocaleString(); li.innerHTML='<span>'+l.m+' min</span><small>'+when+'</small>'; logs.appendChild(li); }); }
  // habits
  const root = document.getElementById('habits');
  if (root){
    root.innerHTML = '';
    const dayLabels = ['S','M','T','W','T','F','S'];
    habits.forEach((h,hi)=>{
      const box = document.createElement('div'); box.className='habit';
      const title = document.createElement('h4'); title.textContent = h.name; box.appendChild(title);
      const grid = document.createElement('div'); grid.className='habit-grid';
      h.week.forEach((v,di)=>{
        const b = document.createElement('button'); b.type='button'; b.textContent = dayLabels[di]; b.setAttribute('data-habit', String(hi)); b.setAttribute('data-day', String(di)); if (v) b.classList.add('on'); grid.appendChild(b);
      });
      box.appendChild(grid); root.appendChild(box);
    });
  }
}

// Mobile menu toggle functionality
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('siteNav');
  
  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', function() {
      siteNav.classList.toggle('mobile-open');
      // Change icon when menu is open
      if (siteNav.classList.contains('mobile-open')) {
        menuToggle.textContent = '✕';
      } else {
        menuToggle.textContent = '☰';
      }
    });
    
    // Close menu when clicking on a link
    const navLinks = siteNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        siteNav.classList.remove('mobile-open');
        menuToggle.textContent = '☰';
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      const isClickInsideNav = siteNav.contains(event.target);
      const isClickOnToggle = menuToggle.contains(event.target);
      
      if (!isClickInsideNav && !isClickOnToggle && siteNav.classList.contains('mobile-open')) {
        siteNav.classList.remove('mobile-open');
        menuToggle.textContent = '☰';
      }
    });
  }
}

// Initialize mobile menu on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
  initMobileMenu();
}

// Confetti animation function
function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  const particles = [];
  const particleCount = 50;
  const colors = ['#22d3ee', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.rotation += particle.rotationSpeed;
      
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
      
      if (particle.y > canvas.height) {
        particles.splice(index, 1);
      }
    });
    
    if (particles.length > 0) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  animate();
}

// Pledge Photo Section
function initPledgePhoto() {
  const PLEDGE_STORAGE_KEY = 'dw_pledges';
  
  const pledgeText = document.getElementById('pledgeText');
  const charCount = document.getElementById('charCount');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
  const fileInput = document.getElementById('fileInput');
  const videoElement = document.getElementById('videoElement');
  const canvasElement = document.getElementById('canvasElement');
  const cameraPlaceholder = document.getElementById('cameraPlaceholder');
  const photoPreview = document.getElementById('photoPreview');
  const previewImage = document.getElementById('previewImage');
  const removePhotoBtn = document.getElementById('removePhoto');
  const submitPledgeBtn = document.getElementById('submitPledgeBtn');
  const pledgeGallery = document.getElementById('pledgeGallery');
  
  let stream = null;
  let capturedPhoto = null;

  // Character counter
  if (pledgeText && charCount) {
    pledgeText.addEventListener('input', () => {
      const count = pledgeText.value.length;
      charCount.textContent = count;
      updateSubmitButton();
    });
  }

  // Start camera
  if (startCameraBtn && videoElement) {
    startCameraBtn.addEventListener('click', async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        cameraPlaceholder.style.display = 'none';
        photoPreview.style.display = 'none';
        captureBtn.style.display = 'flex';
        startCameraBtn.textContent = '📹 Camera Active';
        startCameraBtn.disabled = true;
      } catch (error) {
        alert('Unable to access camera. Please check permissions or try uploading a photo instead.');
        console.error('Camera error:', error);
      }
    });
  }

  // Capture photo
  if (captureBtn && canvasElement && videoElement && previewImage) {
    captureBtn.addEventListener('click', () => {
      const context = canvasElement.getContext('2d');
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0);
      
      capturedPhoto = canvasElement.toDataURL('image/jpeg', 0.8);
      previewImage.src = capturedPhoto;
      
      videoElement.style.display = 'none';
      photoPreview.style.display = 'block';
      cameraPlaceholder.style.display = 'none';
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      
      startCameraBtn.textContent = '📷 Start Camera';
      startCameraBtn.disabled = false;
      captureBtn.style.display = 'none';
      updateSubmitButton();
    });
  }

  // Upload photo
  if (uploadPhotoBtn && fileInput && previewImage) {
    uploadPhotoBtn.addEventListener('click', () => {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          capturedPhoto = event.target.result;
          previewImage.src = capturedPhoto;
          photoPreview.style.display = 'block';
          cameraPlaceholder.style.display = 'none';
          if (videoElement) videoElement.style.display = 'none';
          updateSubmitButton();
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select a valid image file.');
      }
    });
  }

  // Remove photo
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
      capturedPhoto = null;
      photoPreview.style.display = 'none';
      cameraPlaceholder.style.display = 'block';
      if (videoElement) videoElement.style.display = 'none';
      if (fileInput) fileInput.value = '';
      
      // Stop camera if active
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      
      if (startCameraBtn) {
        startCameraBtn.textContent = '📷 Start Camera';
        startCameraBtn.disabled = false;
      }
      if (captureBtn) captureBtn.style.display = 'none';
      updateSubmitButton();
    });
  }

  // Update submit button state
  function updateSubmitButton() {
    if (!submitPledgeBtn) return;
    const hasText = pledgeText && pledgeText.value.trim().length > 0;
    const hasPhoto = capturedPhoto !== null;
    const isLoggedIn = getSession() !== null;
    
    submitPledgeBtn.disabled = !(hasText && hasPhoto && isLoggedIn);
    
    if (!isLoggedIn) {
      submitPledgeBtn.title = 'Please login to submit your pledge';
    } else if (!hasText) {
      submitPledgeBtn.title = 'Please write your pledge';
    } else if (!hasPhoto) {
      submitPledgeBtn.title = 'Please take or upload a photo';
    } else {
      submitPledgeBtn.title = '';
    }
  }

  // Submit pledge
  if (submitPledgeBtn) {
    submitPledgeBtn.addEventListener('click', () => {
      const user = getCurrentUser();
      if (!user) {
        alert('Please login to submit your pledge.');
        window.location.href = 'login.html';
        return;
      }
      
      if (!pledgeText || !pledgeText.value.trim()) {
        alert('Please write your pledge.');
        return;
      }
      
      if (!capturedPhoto) {
        alert('Please take or upload a photo.');
        return;
      }
      
      // Save pledge
      const pledges = getPledges();
      const newPledge = {
        id: Date.now().toString(),
        userId: user.email,
        userName: user.name,
        text: pledgeText.value.trim(),
        photo: capturedPhoto,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString()
      };
      
      pledges.unshift(newPledge);
      // Keep only last 50 pledges
      if (pledges.length > 50) {
        pledges.splice(50);
      }
      savePledges(pledges);
      
      // Reset form
      if (pledgeText) pledgeText.value = '';
      if (charCount) charCount.textContent = '0';
      capturedPhoto = null;
      photoPreview.style.display = 'none';
      cameraPlaceholder.style.display = 'block';
      if (fileInput) fileInput.value = '';
      
      // Show success message
      alert('✅ Your pledge has been submitted successfully!');
      
      // Refresh gallery
      renderPledgeGallery();
      updateSubmitButton();
    });
  }

  // Get pledges from localStorage
  function getPledges() {
    try {
      return JSON.parse(localStorage.getItem(PLEDGE_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  // Save pledges to localStorage
  function savePledges(pledges) {
    localStorage.setItem(PLEDGE_STORAGE_KEY, JSON.stringify(pledges));
  }

  // Render pledge gallery
  function renderPledgeGallery() {
    if (!pledgeGallery) return;
    
    const pledges = getPledges();
    
    if (pledges.length === 0) {
      pledgeGallery.innerHTML = '<p class="no-pledges">No pledges yet. Be the first to make a commitment!</p>';
      return;
    }
    
    pledgeGallery.innerHTML = pledges.map(pledge => `
      <div class="pledge-card">
        <img src="${pledge.photo}" alt="Pledge photo" class="pledge-card-image" loading="lazy">
        <div class="pledge-card-text">${escapeHtml(pledge.text)}</div>
        <div class="pledge-card-meta">
          <span class="pledge-card-author">${escapeHtml(pledge.userName)}</span>
          <span>${pledge.date}</span>
        </div>
      </div>
    `).join('');
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Check login status and update button
  function checkLoginStatus() {
    updateSubmitButton();
    // Update hint text
    const hint = document.querySelector('.pledge-hint');
    if (hint) {
      const isLoggedIn = getSession() !== null;
      hint.textContent = isLoggedIn 
        ? 'Ready to submit your pledge!' 
        : 'Login required to save your pledge';
    }
  }

  // Initial render
  renderPledgeGallery();
  checkLoginStatus();
  
  // Check login status periodically (will be improved with auth events)
  const statusInterval = setInterval(() => {
    checkLoginStatus();
  }, 2000);
  
  // Clean up interval when page unloads
  window.addEventListener('beforeunload', () => {
    if (statusInterval) clearInterval(statusInterval);
    // Stop camera stream if active
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  });
}

// Pledge List Section
function initPledgeList() {
  const USER_PLEDGES_STORAGE_KEY = 'dw_user_pledges';
  
  // Predefined list of pledges
  const predefinedPledges = [
    {
      id: 'pledge-1',
      icon: '📱',
      title: 'Reduce Daily Screen Time',
      description: 'I will reduce my daily screen time by at least 2 hours and use that time for physical activities or hobbies.',
      category: 'Time Management'
    },
    {
      id: 'pledge-2',
      icon: '😴',
      title: 'No Phones Before Bed',
      description: 'I will not use my phone for at least 1 hour before bedtime to improve my sleep quality.',
      category: 'Sleep Health'
    },
    {
      id: 'pledge-3',
      icon: '👨‍👩‍👧‍👦',
      title: 'Tech-Free Family Time',
      description: 'I will keep my phone away during meals and family gatherings to be more present with loved ones.',
      category: 'Relationships'
    },
    {
      id: 'pledge-4',
      icon: '🎯',
      title: 'Focus Without Distractions',
      description: 'I will turn off notifications and keep my phone in another room when working or studying.',
      category: 'Productivity'
    },
    {
      id: 'pledge-5',
      icon: '🚶',
      title: 'Phone-Free Walks',
      description: 'I will go for at least one walk per day without my phone to enjoy nature and clear my mind.',
      category: 'Wellness'
    },
    {
      id: 'pledge-6',
      icon: '📚',
      title: 'Read Instead of Scroll',
      description: 'I will replace 30 minutes of social media scrolling with reading a book or article each day.',
      category: 'Personal Growth'
    },
    {
      id: 'pledge-7',
      icon: '🧘',
      title: 'Morning Meditation',
      description: 'I will start each day with 10 minutes of meditation or mindfulness instead of immediately checking my phone.',
      category: 'Mindfulness'
    },
    {
      id: 'pledge-8',
      icon: '🏋️',
      title: 'Exercise Before Social Media',
      description: 'I will complete my daily exercise routine before spending time on social media or entertainment apps.',
      category: 'Health'
    },
    {
      id: 'pledge-9',
      icon: '💬',
      title: 'Meaningful Conversations',
      description: 'I will have at least one face-to-face meaningful conversation daily without checking my phone.',
      category: 'Relationships'
    },
    {
      id: 'pledge-10',
      icon: '🌙',
      title: 'Digital Sunset',
      description: 'I will stop using all digital devices 2 hours before my intended sleep time.',
      category: 'Sleep Health'
    },
    {
      id: 'pledge-11',
      icon: '🎨',
      title: 'Creative Time',
      description: 'I will dedicate 1 hour daily to creative activities (drawing, writing, music) without digital distractions.',
      category: 'Personal Growth'
    },
    {
      id: 'pledge-12',
      icon: '📵',
      title: 'Weekend Digital Detox',
      description: 'I will have one day per week where I limit my phone use to essential calls and messages only.',
      category: 'Balance'
    }
  ];
  
  const pledgesGrid = document.getElementById('pledgesGrid');
  const selectedPledgesSection = document.getElementById('selectedPledgesSection');
  const selectedPledgesList = document.getElementById('selectedPledgesList');
  const commitPledgesBtn = document.getElementById('commitPledgesBtn');
  const clearPledgesBtn = document.getElementById('clearPledgesBtn');
  const myPledgesSection = document.getElementById('myPledgesSection');
  const myPledgesList = document.getElementById('myPledgesList');
  
  let selectedPledges = new Set();
  
  // Render pledge items
  function renderPledges() {
    if (!pledgesGrid) return;
    
    const user = getCurrentUser();
    const userPledges = user ? getUserPledges().filter(p => 
      p.userId === user.email && p.status !== 'archived'
    ) : [];
    const committedPledgeIds = new Set(userPledges.map(p => p.pledgeId));
    
    pledgesGrid.innerHTML = predefinedPledges.map(pledge => {
      const isCommitted = committedPledgeIds.has(pledge.id);
      const userPledge = userPledges.find(p => p.pledgeId === pledge.id);
      const isCompleted = userPledge && userPledge.status === 'completed';
      
      return `
        <div class="pledge-item ${isCommitted ? 'committed' : ''} ${isCompleted ? 'completed' : ''}" data-pledge-id="${pledge.id}">
          <div class="pledge-item-checkbox"></div>
          <div class="pledge-item-content">
            <div class="pledge-item-icon">${pledge.icon}</div>
            <h4 class="pledge-item-title">${escapeHtml(pledge.title)}</h4>
            <p class="pledge-item-description">${escapeHtml(pledge.description)}</p>
            <span class="pledge-item-category">${escapeHtml(pledge.category)}</span>
            ${isCommitted ? `<div class="pledge-item-badge ${isCompleted ? 'completed' : 'active'}">${isCompleted ? '✓ Completed' : '✓ Committed'}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    // Add click listeners
    const pledgeItems = pledgesGrid.querySelectorAll('.pledge-item');
    pledgeItems.forEach(item => {
      item.addEventListener('click', () => {
        const pledgeId = item.getAttribute('data-pledge-id');
        const isCommitted = committedPledgeIds.has(pledgeId);
        
        // Don't allow selecting already committed pledges
        if (!isCommitted) {
          togglePledge(pledgeId);
        } else {
          alert('You have already committed to this pledge. Check "My Active Pledges" section below.');
        }
      });
    });
  }
  
  // Toggle pledge selection
  function togglePledge(pledgeId) {
    if (selectedPledges.has(pledgeId)) {
      selectedPledges.delete(pledgeId);
    } else {
      selectedPledges.add(pledgeId);
    }
    
    updatePledgeUI();
    updateSelectedPledgesList();
  }
  
  // Update pledge UI
  function updatePledgeUI() {
    const pledgeItems = pledgesGrid.querySelectorAll('.pledge-item');
    pledgeItems.forEach(item => {
      const pledgeId = item.getAttribute('data-pledge-id');
      if (selectedPledges.has(pledgeId)) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
    if (selectedPledges.size > 0) {
      selectedPledgesSection.style.display = 'block';
    } else {
      selectedPledgesSection.style.display = 'none';
    }
  }
  
  // Update selected pledges list
  function updateSelectedPledgesList() {
    if (!selectedPledgesList) return;
    
    if (selectedPledges.size === 0) {
      selectedPledgesList.innerHTML = '';
      return;
    }
    
    selectedPledgesList.innerHTML = Array.from(selectedPledges).map(pledgeId => {
      const pledge = predefinedPledges.find(p => p.id === pledgeId);
      if (!pledge) return '';
      return `
        <div class="selected-pledge-item">
          <span class="selected-pledge-item-text">${escapeHtml(pledge.title)}</span>
          <button class="selected-pledge-item-remove" data-pledge-id="${pledgeId}">Remove</button>
        </div>
      `;
    }).join('');
    
    // Add remove listeners
    selectedPledgesList.querySelectorAll('.selected-pledge-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pledgeId = btn.getAttribute('data-pledge-id');
        selectedPledges.delete(pledgeId);
        updatePledgeUI();
        updateSelectedPledgesList();
      });
    });
  }
  
  // Clear all selections
  if (clearPledgesBtn) {
    clearPledgesBtn.addEventListener('click', () => {
      selectedPledges.clear();
      updatePledgeUI();
      updateSelectedPledgesList();
    });
  }
  
  // Commit to pledges
  if (commitPledgesBtn) {
    commitPledgesBtn.addEventListener('click', () => {
      const user = getCurrentUser();
      if (!user) {
        alert('Please login to commit to pledges.');
        window.location.href = 'login.html';
        return;
      }
      
      if (selectedPledges.size === 0) {
        alert('Please select at least one pledge to commit to.');
        return;
      }
      
      // Get user's existing pledges
      const userPledges = getUserPledges();
      const timestamp = Date.now();
      let newCount = 0;
      
      // Add new pledges
      Array.from(selectedPledges).forEach(pledgeId => {
        const pledge = predefinedPledges.find(p => p.id === pledgeId);
        if (pledge) {
          // Check if user already has this pledge (and it's not completed)
          const existingPledge = userPledges.find(p => 
            p.pledgeId === pledgeId && 
            p.userId === user.email && 
            p.status !== 'archived'
          );
          if (!existingPledge) {
            userPledges.push({
              id: `${user.email}-${pledgeId}-${timestamp}`,
              userId: user.email,
              userName: user.name,
              pledgeId: pledgeId,
              title: pledge.title,
              icon: pledge.icon,
              description: pledge.description,
              category: pledge.category,
              status: 'active',
              committedAt: timestamp,
              completedAt: null
            });
            newCount++;
          }
        }
      });
      
      saveUserPledges(userPledges);
      
      // Clear selection
      const selectedCount = selectedPledges.size;
      selectedPledges.clear();
      updatePledgeUI();
      updateSelectedPledgesList();
      
      // Show success message
      if (newCount > 0) {
        alert(`✅ Successfully committed to ${newCount} pledge(s)!`);
      } else {
        alert('ℹ️ You have already committed to these pledges.');
      }
      
      // Refresh my pledges
      renderMyPledges();
    });
  }
  
  // Get user pledges
  function getUserPledges() {
    try {
      return JSON.parse(localStorage.getItem(USER_PLEDGES_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }
  
  // Save user pledges
  function saveUserPledges(pledges) {
    localStorage.setItem(USER_PLEDGES_STORAGE_KEY, JSON.stringify(pledges));
  }
  
  // Render my pledges
  function renderMyPledges() {
    if (!myPledgesList || !myPledgesSection) return;
    
    const user = getCurrentUser();
    if (!user) {
      myPledgesSection.style.display = 'none';
      return;
    }
    
    const userPledges = getUserPledges().filter(p => 
      p.userId === user.email && p.status !== 'archived'
    );
    
    if (userPledges.length === 0) {
      myPledgesSection.style.display = 'none';
      return;
    }
    
    myPledgesSection.style.display = 'block';
    
    // Sort: active first, then completed
    userPledges.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return b.committedAt - a.committedAt;
    });
    
    myPledgesList.innerHTML = userPledges.map(pledge => {
      const daysSince = Math.floor((Date.now() - pledge.committedAt) / (1000 * 60 * 60 * 24));
      const statusClass = pledge.status === 'completed' ? 'completed' : 'active';
      const statusText = pledge.status === 'completed' ? 'Completed' : `Active - Day ${daysSince + 1}`;
      
      return `
        <div class="my-pledge-card ${statusClass}">
          <div class="my-pledge-card-header">
            <div class="my-pledge-card-title">
              <span class="my-pledge-card-icon">${pledge.icon}</span>
              ${escapeHtml(pledge.title)}
            </div>
            <span class="my-pledge-card-status ${statusClass}">${statusText}</span>
          </div>
          <p style="color: var(--muted); font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
            ${escapeHtml(pledge.description)}
          </p>
          <div class="my-pledge-card-meta">
            <span>Committed: ${new Date(pledge.committedAt).toLocaleDateString()}</span>
            <div class="my-pledge-card-actions">
              ${pledge.status !== 'completed' ? `
                <button class="my-pledge-card-btn complete" data-pledge-id="${pledge.id}">Mark Complete</button>
                <button class="my-pledge-card-btn" data-pledge-id="${pledge.id}" data-action="archive">Archive</button>
              ` : `
                <span style="color: var(--muted); font-size: 12px;">
                  Completed: ${new Date(pledge.completedAt).toLocaleDateString()}
                </span>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    // Add action listeners
    myPledgesList.querySelectorAll('.my-pledge-card-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pledgeId = btn.getAttribute('data-pledge-id');
        const action = btn.getAttribute('data-action');
        
        if (action === 'archive') {
          archivePledge(pledgeId);
        } else {
          completePledge(pledgeId);
        }
      });
    });
  }
  
  // Complete pledge
  function completePledge(pledgeId) {
    if (confirm('Have you completed this pledge? Marking it as complete will move it to your completed pledges.')) {
      const userPledges = getUserPledges();
      const pledge = userPledges.find(p => p.id === pledgeId);
      
      if (pledge) {
        pledge.status = 'completed';
        pledge.completedAt = Date.now();
        saveUserPledges(userPledges);
        renderMyPledges();
        alert('🎉 Congratulations! You completed your pledge!');
      }
    }
  }
  
  // Archive pledge
  function archivePledge(pledgeId) {
    if (confirm('Are you sure you want to archive this pledge? You can always select it again from the list.')) {
      const userPledges = getUserPledges();
      const pledge = userPledges.find(p => p.id === pledgeId);
      
      if (pledge) {
        pledge.status = 'archived';
        saveUserPledges(userPledges);
        renderMyPledges();
      }
    }
  }
  
  // Escape HTML helper (reuse from above if available)
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Initial render
  renderPledges();
  renderMyPledges();
  
  // Re-render when login status changes or pledges are committed
  setInterval(() => {
    renderPledges();
    renderMyPledges();
  }, 2000);
}


