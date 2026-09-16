/* =========================================================
   THE MAN BEHIND THE NAME — Manikandan
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Opening Sequence and background music are deferred until the
    // gate is unlocked — see initResolutionGate() below.
    initResolutionGate();

    duplicateFilmstrip();
    initQuiz();
    initPuzzle();
    initTimelineReveal();
    initNavToggle();
});

/* ---------- RESOLUTION GATE: one question at a time, No is unpickable ---------- */
function initResolutionGate() {
    const gate = document.getElementById('resolutionGate');
    if (!gate) return;

    const stage = document.getElementById('resStage');
    const allItems = Array.from(stage.querySelectorAll('.res-item'));
    const finalPanel = stage.querySelector('.res-final');
    const questionItems = allItems.filter(i => i !== finalPanel);
    const dotsWrap = document.getElementById('resProgressDots');
    const stepLabel = document.getElementById('resStepLabel');

    // Prevent scrolling while gate is active
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    // Progress dots, one per resolution question
    questionItems.forEach(() => {
        const d = document.createElement('span');
        d.className = 'dot';
        dotsWrap.appendChild(d);
    });
    const dots = Array.from(dotsWrap.children);
    let currentIndex = 0;

    function updateDots() {
        dots.forEach((d, i) => {
            d.classList.toggle('done', i < currentIndex);
            d.classList.toggle('current', i === currentIndex);
        });
    }

    function showStep(index) {
        allItems.forEach(item => item.classList.remove('active'));
        if (index < questionItems.length) {
            questionItems[index].classList.add('active');
            stepLabel.textContent = `Question ${index + 1} of ${questionItems.length}`;
        } else {
            finalPanel.classList.add('active');
            stepLabel.textContent = `All Promises Sealed`;
        }
        updateDots();
    }

    function showBubble(item, text, left, top) {
        const bubble = item.querySelector('.res-funny-bubble');
        if (!bubble) return;
        bubble.textContent = text;
        bubble.style.left = left + 'px';
        bubble.style.top = top + 'px';
        bubble.classList.add('show');
        clearTimeout(bubble._hideTimer);
        bubble._hideTimer = setTimeout(() => bubble.classList.remove('show'), 1200);
    }

    questionItems.forEach((item) => {
        const yesBtn = item.querySelector('.res-yes');
        const noBtn = item.querySelector('.res-no');
        if (!yesBtn || !noBtn) return;

        let dodgeCount = 0;
        let tucked = false;
        let isDodging = false;

        function dodge() {
            if (tucked || isDodging) return;
            isDodging = true;
            dodgeCount++;

            // User gets 3 tries to click No
            if (dodgeCount > 3) {
                tuckBehindYes();
                return;
            }

            const zone = item.querySelector('.res-choice');
            const zoneRect = zone.getBoundingClientRect();
            const btnRect = noBtn.getBoundingClientRect();
            
            // Calculate a safe random spot inside the container
            const maxLeft = Math.max(zoneRect.width - btnRect.width, 10);
            const maxTop = Math.max(zoneRect.height - btnRect.height, 10);
            const newLeft = Math.random() * maxLeft;
            const newTop = Math.random() * maxTop;

            // Apply new position
            noBtn.style.left = newLeft + 'px';
            noBtn.style.top = newTop + 'px';
            noBtn.style.transform = 'translate(0, 0)'; // removing the initial -50% centering
            
            // Funny messages
            let messages = ["Nice try! 😅", "Missed me! 😂", "Too slow! 😝"];
            showBubble(item, messages[dodgeCount - 1], newLeft + (btnRect.width / 2), newTop);

            // Brief cooldown to prevent accidental double-clicks from maxing it out instantly
            setTimeout(() => { isDodging = false; }, 300);
        }

        function tuckBehindYes() {
            tucked = true;
            const zone = item.querySelector('.res-choice');
            const zoneRect = zone.getBoundingClientRect();
            const yesRect = yesBtn.getBoundingClientRect();
            
            noBtn.style.left = (yesRect.left - zoneRect.left) + 'px';
            noBtn.style.top = (yesRect.top - zoneRect.top) + 'px';
            noBtn.style.width = yesRect.width + 'px';
            noBtn.style.height = yesRect.height + 'px';
            noBtn.style.transform = 'translate(0, 0)';
            noBtn.classList.add('tucked');
            
            showBubble(item, "Nowhere left to hide! 🎬", (yesRect.left - zoneRect.left) + (yesRect.width / 2), (yesRect.top - zoneRect.top));
        }

        // We removed hover/mousemove. It ONLY triggers on click or touch.
        noBtn.addEventListener('click', (e) => { e.preventDefault(); dodge(); });
        noBtn.addEventListener('touchstart', (e) => { e.preventDefault(); dodge(); }, { passive: false });

        yesBtn.addEventListener('click', () => {
            if (!item.classList.contains('active')) return;
            currentIndex++;
            showStep(currentIndex);

            if (currentIndex >= questionItems.length) {
                // Last promise sealed — auto-unlock into the site
                setTimeout(() => {
                    gate.classList.add('hidden');
                    document.body.style.overflow = '';
                    setTimeout(() => {
                        runOpeningSequence();
                        initBgMusic();
                    }, 500);
                }, 1600);
            }
        });
    });

    showStep(0);
}

/* ---------- SITE-WIDE BACKGROUND MUSIC ---------- */
function initBgMusic() {
    const bgMusic = document.getElementById('bgMusic');
    const toggle = document.getElementById('musicToggleBtn');
    if (!bgMusic || !toggle) return;

    let playing = false;
    window.bgMusicWasAutoPaused = false; // Track if we auto-paused it

    function setUI(isPlaying) {
        playing = isPlaying;
        toggle.classList.toggle('active', isPlaying);
        const stateEl = toggle.querySelector('.music-state');
        if (stateEl) stateEl.textContent = isPlaying ? 'ON' : 'OFF';
        toggle.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
    }

    function tryPlay() {
        bgMusic.play().then(() => setUI(true)).catch(() => setUI(false));
    }

    // Global functions to handle music state from modals
    window.pauseBgMusic = function() {
        if (playing) {
            bgMusic.pause();
            setUI(false);
            window.bgMusicWasAutoPaused = true;
        }
    };

    window.resumeBgMusic = function() {
        if (window.bgMusicWasAutoPaused) {
            tryPlay();
            window.bgMusicWasAutoPaused = false;
        }
    };

    // Try to autoplay as soon as the page loads.
    tryPlay();

    // Most browsers block audio-with-sound autoplay until the visitor
    // interacts with the page — so start it on the very first tap/click/key
    // anywhere, if it hasn't already started.
    const startOnFirstInteraction = () => {
        if (!playing) tryPlay();
        document.removeEventListener('click', startOnFirstInteraction);
        document.removeEventListener('touchstart', startOnFirstInteraction);
        document.removeEventListener('keydown', startOnFirstInteraction);
    };
    document.addEventListener('click', startOnFirstInteraction, { once: true });
    document.addEventListener('touchstart', startOnFirstInteraction, { once: true });
    document.addEventListener('keydown', startOnFirstInteraction, { once: true });

    toggle.addEventListener('click', () => {
        if (playing) {
            bgMusic.pause();
            setUI(false);
            window.bgMusicWasAutoPaused = false; // User paused it manually, clear the auto-flag
        } else {
            tryPlay();
            window.bgMusicWasAutoPaused = false; // User played it manually, clear the auto-flag
        }
    });
}

/* ---------- MOBILE NAV TOGGLE ---------- */
function initNavToggle() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!toggle || !links) return;

    const closeMenu = () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
    };

    toggle.addEventListener('click', () => {
        const isOpen = links.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
}

/* ---------- OPENING SEQUENCE ---------- */
function runOpeningSequence() {
    const intro = document.getElementById('openingIntro');
    const countEl = document.getElementById('introCount');
    const flash = document.getElementById('clapFlash');
    if (!intro || !countEl) return;

    document.body.style.overflow = 'hidden';

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        intro.classList.add('hide');
        document.body.style.overflow = '';
        setTimeout(() => intro.remove(), 300);
        return;
    }

    let count = 15;
    const tick = setInterval(() => {
        count--;
        if (count > 0) {
            countEl.textContent = count;
        } else {
            clearInterval(tick);
            countEl.textContent = '';
            intro.classList.add('clap');
            if(flash) flash.classList.add('flash');
            setTimeout(() => {
                intro.classList.add('hide');
                document.body.style.overflow = '';
                setTimeout(() => intro.remove(), 650);
            }, 420);
        }
    }, 500);
}

/* ---------- FILM STRIP: duplicate items for seamless loop ---------- */
function duplicateFilmstrip() {
    const track = document.getElementById('filmstripTrack');
    if (!track) return;
    track.innerHTML += track.innerHTML;
}

/* ---------- AUDIO + PICTURE REVEAL ---------- */
function playAudio() {
    const audio = document.getElementById('specialAudio');

    // Show her picture in the lightbox
    openModal('shashika_img.jpeg', "Sashtika ♡", 'image');

    // Play the voice/ringtone underneath
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
            alert("Couldn't auto-play the audio — tap the picture again, or check that audio.mp4 is uploaded next to your HTML file.");
        });
    }

    // Pause Background Music while special audio plays
    if (window.pauseBgMusic) window.pauseBgMusic();
}

/* ---------- PUZZLE: slide the tiles to rebuild the picture ---------- */
const PUZZLE_DIM = 3;
let puzzleState = [];
let puzzleGridEl, puzzleStatusEl;

function initPuzzle() {
    puzzleGridEl = document.getElementById('puzzleGrid');
    puzzleStatusEl = document.getElementById('puzzleStatus');
    const shuffleBtn = document.getElementById('puzzleShuffle');
    if (!puzzleGridEl) return;

    puzzleState = Array.from({ length: PUZZLE_DIM * PUZZLE_DIM }, (_, i) => i);
    shufflePuzzle();
    renderPuzzle();

    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            puzzleState = Array.from({ length: PUZZLE_DIM * PUZZLE_DIM }, (_, i) => i);
            shufflePuzzle();
            renderPuzzle();
            if(puzzleStatusEl) puzzleStatusEl.textContent = '';
            puzzleGridEl.classList.remove('solved');
        });
    }
}

function shufflePuzzle() {
    const blankValue = PUZZLE_DIM * PUZZLE_DIM - 1;
    for (let m = 0; m < 150; m++) {
        const blankIndex = puzzleState.indexOf(blankValue);
        const neighbors = getNeighborIndices(blankIndex);
        const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];
        [puzzleState[blankIndex], puzzleState[swapWith]] = [puzzleState[swapWith], puzzleState[blankIndex]];
    }
}

function getNeighborIndices(index) {
    const row = Math.floor(index / PUZZLE_DIM);
    const col = index % PUZZLE_DIM;
    const neighbors = [];
    if (row > 0) neighbors.push(index - PUZZLE_DIM);
    if (row < PUZZLE_DIM - 1) neighbors.push(index + PUZZLE_DIM);
    if (col > 0) neighbors.push(index - 1);
    if (col < PUZZLE_DIM - 1) neighbors.push(index + 1);
    return neighbors;
}

function renderPuzzle() {
    const blankValue = PUZZLE_DIM * PUZZLE_DIM - 1;
    puzzleGridEl.innerHTML = '';

    puzzleState.forEach((value, index) => {
        const tile = document.createElement('button');
        tile.classList.add('puzzle-tile');

        if (value === blankValue) {
            tile.classList.add('blank');
        } else {
            const col = value % PUZZLE_DIM;
            const row = Math.floor(value / PUZZLE_DIM);
            const step = 100 / (PUZZLE_DIM - 1);
            tile.style.backgroundPosition = `${col * step}% ${row * step}%`;
            tile.setAttribute('aria-label', 'Puzzle tile');
            tile.addEventListener('click', () => handleTileClick(index));
        }
        puzzleGridEl.appendChild(tile);
    });
}

function handleTileClick(index) {
    const blankValue = PUZZLE_DIM * PUZZLE_DIM - 1;
    const blankIndex = puzzleState.indexOf(blankValue);
    const neighbors = getNeighborIndices(blankIndex);

    if (!neighbors.includes(index)) return;

    [puzzleState[blankIndex], puzzleState[index]] = [puzzleState[index], puzzleState[blankIndex]];
    renderPuzzle();

    if (isPuzzleSolved()) {
        puzzleGridEl.classList.add('solved');
        if(puzzleStatusEl) puzzleStatusEl.textContent = "Picture's clear now. Just like this scene. ❤️";
    }
}

function isPuzzleSolved() {
    return puzzleState.every((value, index) => value === index);
}

/* ---------- QUIZ / SCREEN TEST ---------- */
const questions = [
    {
        question: "What happens to his phone battery most often?",
        options: ["Always 100% 🔋", "Never below 50%", "0% — as usual 💀", "Power bank king"],
        answer: 2
    },
    {
        question: "His emergency hunger solution?",
        options: ["Idli Sambar", "VADA PAV 🌶️", "Maggie", "Dosa"],
        answer: 1
    },
    {
        question: "Which soundtrack owns him?",
        options: ["A.R. Rahman", "Anirudh", "Ilaiyaraaja 🎵", "Yuvan"],
        answer: 2
    },
    {
        question: "What's his second big dream?",
        options: ["Start a business", "Direct a movie 🎬", "Travel the world", "Become a chef"],
        answer: 1
    }
];

let currentQuestionIndex = 0;
let score = 0;
let quizLocked = false;

let questionText, optionsContainer, quizContent, quizResult, reelProgress;

function initQuiz() {
    questionText = document.getElementById("question-text");
    optionsContainer = document.getElementById("options-container");
    quizContent = document.getElementById("quiz-content");
    quizResult = document.getElementById("quiz-result");
    reelProgress = document.getElementById("reelProgress");
    if (!questionText) return;

    buildReelDots();
    loadQuestion();
}

function buildReelDots() {
    if(!reelProgress) return;
    reelProgress.innerHTML = "";
    questions.forEach(() => {
        const dot = document.createElement("span");
        dot.classList.add("reel-dot");
        reelProgress.appendChild(dot);
    });
}

function updateReelDots() {
    if(!reelProgress) return;
    const dots = reelProgress.querySelectorAll(".reel-dot");
    dots.forEach((dot, i) => {
        dot.classList.toggle("done", i < currentQuestionIndex);
    });
}

function loadQuestion() {
    quizLocked = false;
    updateReelDots();
    const currentQ = questions[currentQuestionIndex];
    questionText.innerText = currentQ.question;
    optionsContainer.innerHTML = "";

    currentQ.options.forEach((opt, index) => {
        const btn = document.createElement("button");
        btn.classList.add("option-btn");
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(index, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selectedIndex, btn) {
    if (quizLocked) return;
    quizLocked = true;

    const correctIndex = questions[currentQuestionIndex].answer;
    const allBtns = optionsContainer.querySelectorAll(".option-btn");

    if (selectedIndex === correctIndex) {
        score++;
        btn.classList.add("correct-flash");
    } else {
        btn.classList.add("wrong-flash");
        allBtns[correctIndex].classList.add("correct-flash");
    }

    allBtns.forEach(b => b.disabled = true);

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            updateReelDots();
            showResult();
        }
    }, 650);
}

function showResult() {
    if(quizContent) quizContent.style.display = "none";
    if(quizResult) {
        quizResult.style.display = "block";
        const scoreLine = `<span class="score-line">Score: ${score}/${questions.length}</span>`;

        if (score > 2) {
            quizResult.innerHTML = "Okay… you actually know Manikandan. ❤️" + scoreLine;
        } else {
            quizResult.innerHTML = "Bro… you clearly need to spend more time with him. 😂" + scoreLine;
        }
    }
}

/* ---------- MODAL / LIGHTBOX (images + video reveals) ---------- */
let nextVideoQueue = []; // Now stores an array of upcoming videos

function openModal(src, captionText, type = 'image', nextVideos = []) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    const modalVideo = document.getElementById("modalVideo");
    const caption = document.getElementById("modalCaption");
    const nextBtn = document.getElementById("modalNextBtn");

    if(!modal) return;
    modal.style.display = "block";
    if(caption) caption.innerHTML = captionText;

    // Track if there's a second (or third) video to play
    if (typeof nextVideos === 'string') {
        nextVideoQueue = [nextVideos];
    } else {
        nextVideoQueue = [...(nextVideos || [])];
    }

    if (nextBtn) {
        if (nextVideoQueue.length > 0) {
            nextBtn.style.display = "block";
        } else {
            nextBtn.style.display = "none";
        }
    }

    if (type === 'video') {
        if(modalImg) modalImg.style.display = "none";
        if(modalImg) modalImg.src = "";
        if(modalVideo) {
            modalVideo.style.display = "block";
            modalVideo.src = src;
            modalVideo.currentTime = 0;
            modalVideo.play().catch(() => {});
        }

        // Pause Background Music while video plays
        if (window.pauseBgMusic) window.pauseBgMusic();

    } else {
        if(modalVideo) {
            modalVideo.pause();
            modalVideo.style.display = "none";
            modalVideo.src = "";
        }
        if(modalImg) {
            modalImg.style.display = "block";
            modalImg.src = src;
        }
    }
}

function playNextVideo() {
    if (nextVideoQueue.length > 0) {
        const nextSrc = nextVideoQueue.shift(); // Get first in line and remove it
        
        const modalVideo = document.getElementById("modalVideo");
        if (modalVideo) {
            modalVideo.src = nextSrc;
            modalVideo.currentTime = 0;
            modalVideo.play().catch(() => {});
        }
        
        // Hide button if the queue is now empty
        const nextBtn = document.getElementById("modalNextBtn");
        if (nextBtn) {
            if (nextVideoQueue.length === 0) {
                nextBtn.style.display = "none";
            }
        }
    }
}

function closeModal() {
    const modal = document.getElementById("imageModal");
    const modalVideo = document.getElementById("modalVideo");
    const specialAudio = document.getElementById("specialAudio");
    const nextBtn = document.getElementById("modalNextBtn");
    
    if (modalVideo) modalVideo.pause();
    if (specialAudio) specialAudio.pause();
    if (modal) modal.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    
    // Clear out state
    nextVideoQueue = []; 

    // Resume Background Music when modal closes
    if (window.resumeBgMusic) window.resumeBgMusic();
}

window.onclick = function (event) {
    const modal = document.getElementById("imageModal");
    if (event.target == modal) {
        closeModal();
    }
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

/* ---------- TIMELINE: reveal frames + scroll-linked gold fill ---------- */
function initTimelineReveal() {
    const track = document.getElementById('timelineTrack');
    if (!track) return;
    const frames = track.querySelectorAll('.timeline-frame');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
    }, { threshold: 0.4 });
    frames.forEach(f => observer.observe(f));

    const onScroll = () => {
        const rect = track.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const total = rect.height;
        let visible = viewportH * 0.75 - rect.top;
        visible = Math.max(0, Math.min(visible, total));
        const pct = total > 0 ? (visible / total) * 100 : 0;
        track.style.setProperty('--fill', pct + '%');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}


/* =========================================================================
   ACT SEVEN: THE GRAND FINALE
   Gift box -> cake & candles -> photo memories -> letter -> finale.
   Adapted to live inside the page (not a standalone fullscreen app):
   canvases and scroll targets are scoped to the #celebration section.
   ========================================================================= */

const birthdayName = "Mani Mama";

const birthdayMessage = `**En CA… En Director… En Forever ❤️**

Accounts-la numbers-a thedi,
Life-la dreams-a thedi,
Oru pakkam **CA** aaga pora nee…
Innor pakkam **Cinema-va direct** panna pora nee…

Books un kaiyila irundhaalum,
Un manasula eppovume oru **screenplay** odudhu…
Balance sheet-la profit & loss paakra nee,
Aana en life-la vandhu
**Profit mattum kudutha manushan nee.** ❤️

CA exam-ku padikkira ovvoru iravum,
Un kanavukkaaga nee podra ovvoru muyarchiyum,
Oru naal…
**"Action!"** nu nee sollumbodhu
Andha screen-la theriyum…
Nee kadandhu vandha paadhai ellam. 🎬

Innaiku birthday…
Aana idhu just oru birthday illa…
**Un dreams rendu perum
Orey naal-la celebrate panna vendiya beginning.**

Oru naal naan proud-a sollanum…

**"Avan en CA mattum illa…
Avan oru Director.
Avan en Director mattum illa…
Avan dhaan en Forever."** ❤️

Un calculations ellam success-a balance aaganum…
Un stories ellam blockbuster-a aaganum…
Un dreams ellam reality-a maaranum…

And most importantly…

**Un life oda beautiful-aana
every frame-la…
Naanum irukkanum.** ❤️🎬

**Happy Birthday, En CA…
My Director…
My Dreamer…
My Forever.** 🫶🏻
                     `
;

const memoryImages = [
    { url: "photo_7.jpeg", caption: "Where It All Began 🕰️" },
    { url: "photo_2.jpeg", caption: "Back to Our Roots 🌿" },
    { url: "photo_3.jpeg", caption: "Quiet Thoughts at Night 💭" },
    { url: "photo_4.jpeg", caption: "Just Being U 😌" },
    { url: "photo_5.jpeg", caption: "Another Day at Work 💼" },
    { url: "photo_6.jpeg", caption: "A Story Still Unfolding" },
    { url: "photo_1.jpeg", caption: "Living the Good Times 😎" },
    { url: "photo_8.jpeg", caption: "Ready for the Day ✨" },
    { url: "photo_9.jpeg", caption: "Out on the Open Road 🛣️" },
    { url: "photo_10.jpeg", caption: "Late Night in Sea Shore 🌃" },
    { url: "Main_img.jpeg", caption: "Every Chapter, Him ❤️" }
];

const cxState = {
    isBoxOpen: false,
    candlesLit: false,
    candlesBlown: false,
    cakeCut: false,
    envelopeOpen: false,
    micListening: false,
    micStream: null
};

const cx = {
    giftStage: document.getElementById('giftStage'),
    cakeStage: document.getElementById('cakeStage'),
    memoryStage: document.getElementById('memoryStage'),
    letterStage: document.getElementById('letterStage'),
    finalStage: document.getElementById('finalStage'),

    giftBoxWrapper: document.getElementById('giftBoxWrapper'),
    giftTapHint: document.getElementById('giftTapHint'),

    recipientNameDisplay: document.getElementById('recipientNameDisplay'),
    cakeStructure: document.getElementById('cakeStructure'),
    cakeInstruction: document.getElementById('cakeInstruction'),
    flames: [document.getElementById('flame1'), document.getElementById('flame2'), document.getElementById('flame3')],
    candleItems: document.querySelectorAll('.candle-item'),
    cakeKnife: document.getElementById('cakeKnife'),
    lightCandlesBtn: document.getElementById('lightCandlesBtn'),
    blowControls: document.getElementById('blowControls'),
    blowCandlesBtn: document.getElementById('blowCandlesBtn'),
    micStatusText: document.getElementById('micStatusText'),
    cutCakeBtn: document.getElementById('cutCakeBtn'),
    goToMemoriesBtn: document.getElementById('goToMemoriesBtn'),

    polaroidGallery: document.getElementById('polaroidGallery'),
    goToLetterBtn: document.getElementById('goToLetterBtn'),

    envelope3D: document.getElementById('envelope3D'),
    letterNameDisplay: document.getElementById('letterNameDisplay'),
    letterBodyContent: document.getElementById('letterBodyContent'),
    envelopeHint: document.getElementById('envelopeHint'),

    finaleNameDisplay: document.getElementById('finaleNameDisplay'),
    replayExperienceBtn: document.getElementById('replayExperienceBtn'),

    ambientCanvas: document.getElementById('ambientCanvas'),
    fxCanvas: document.getElementById('fxCanvas'),
    root: document.getElementById('celebration')
};

/* ---------- CANVASES, SCOPED TO THE SECTION ---------- */
let cxAmbientCtx, cxFxCtx;
let cxAmbientParticles = [];
let cxCelebrationParticles = [];
let cxFireworks = [];
let cxCanvasWidth = 0;
let cxCanvasHeight = 0;

function cxToLocal(clientX, clientY) {
    if (!cx.root) return { x: clientX, y: clientY };
    const rect = cx.root.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function initCxCanvases() {
    if (!cx.ambientCanvas || !cx.fxCanvas || !cx.root) return;
    cxAmbientCtx = cx.ambientCanvas.getContext('2d');
    cxFxCtx = cx.fxCanvas.getContext('2d');
    resizeCxCanvases();
    window.addEventListener('resize', resizeCxCanvases);

    cxAmbientParticles = [];
    const starCount = Math.min(Math.floor((cxCanvasWidth * cxCanvasHeight) / 12000), 90);
    for (let i = 0; i < starCount; i++) {
        cxAmbientParticles.push({
            x: Math.random() * cxCanvasWidth,
            y: Math.random() * cxCanvasHeight,
            radius: Math.random() * 1.8 + 0.5,
            alpha: Math.random() * 0.7 + 0.3,
            alphaSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
            vy: Math.random() * 0.25 + 0.05,
            color: ['#e3bd63', '#f6f1e4', '#ffffff', '#cfd6c6'][Math.floor(Math.random() * 4)]
        });
    }

    requestAnimationFrame(renderCxAmbientLoop);
    requestAnimationFrame(renderCxFxLoop);
}

function resizeCxCanvases() {
    if (!cx.root) return;
    cxCanvasWidth = cx.root.clientWidth;
    cxCanvasHeight = Math.max(cx.root.clientHeight, 640);
    cx.ambientCanvas.width = cxCanvasWidth;
    cx.ambientCanvas.height = cxCanvasHeight;
    cx.fxCanvas.width = cxCanvasWidth;
    cx.fxCanvas.height = cxCanvasHeight;
}

function renderCxAmbientLoop() {
    cxAmbientCtx.clearRect(0, 0, cxCanvasWidth, cxCanvasHeight);
    for (const p of cxAmbientParticles) {
        p.y -= p.vy;
        if (p.y < 0) { p.y = cxCanvasHeight; p.x = Math.random() * cxCanvasWidth; }
        p.alpha += p.alphaSpeed;
        if (p.alpha > 0.95 || p.alpha < 0.2) p.alphaSpeed = -p.alphaSpeed;

        cxAmbientCtx.beginPath();
        cxAmbientCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        cxAmbientCtx.fillStyle = p.color;
        cxAmbientCtx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        cxAmbientCtx.shadowBlur = 8;
        cxAmbientCtx.shadowColor = p.color;
        cxAmbientCtx.fill();
    }
    cxAmbientCtx.globalAlpha = 1;
    cxAmbientCtx.shadowBlur = 0;
    requestAnimationFrame(renderCxAmbientLoop);
}

function renderCxFxLoop() {
    cxFxCtx.clearRect(0, 0, cxCanvasWidth, cxCanvasHeight);

    for (let i = cxCelebrationParticles.length - 1; i >= 0; i--) {
        const p = cxCelebrationParticles[i];
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity;
        p.rotation += p.rotSpeed; p.alpha -= p.decay;
        if (p.alpha <= 0 || p.y > cxCanvasHeight + 50) { cxCelebrationParticles.splice(i, 1); continue; }

        cxFxCtx.save();
        cxFxCtx.translate(p.x, p.y);
        cxFxCtx.rotate(p.rotation);
        cxFxCtx.globalAlpha = Math.max(0, p.alpha);

        if (p.shape === 'rect') {
            cxFxCtx.fillStyle = p.color;
            cxFxCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === 'heart') {
            cxFxCtx.fillStyle = p.color;
            cxDrawHeart(cxFxCtx, 0, 0, p.size);
        } else if (p.shape === 'star') {
            cxFxCtx.fillStyle = p.color;
            cxDrawStar(cxFxCtx, 0, 0, 5, p.size, p.size / 2);
        } else {
            cxFxCtx.beginPath();
            cxFxCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            cxFxCtx.fillStyle = p.color;
            cxFxCtx.fill();
        }
        cxFxCtx.restore();
    }

    for (let i = cxFireworks.length - 1; i >= 0; i--) {
        const fw = cxFireworks[i];
        if (!fw.exploded) {
            fw.x += fw.vx; fw.y += fw.vy; fw.vy += 0.08;
            cxFxCtx.beginPath();
            cxFxCtx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
            cxFxCtx.fillStyle = '#f1d78c';
            cxFxCtx.shadowBlur = 10;
            cxFxCtx.shadowColor = '#c99a3f';
            cxFxCtx.fill();
            cxFxCtx.shadowBlur = 0;

            if (fw.vy >= -0.5 || fw.y <= fw.targetY) {
                fw.exploded = true;
                cxCreateFireworkBurst(fw.x, fw.y, fw.color);
                cxFireworks.splice(i, 1);
            }
        }
    }
    requestAnimationFrame(renderCxFxLoop);
}

function cxDrawHeart(ctx, x, y, size) {
    ctx.beginPath();
    const t = size * 0.3;
    ctx.moveTo(x, y + t);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + t);
    ctx.bezierCurveTo(x - size / 2, y + (size + t) / 2, x, y + size, x, y + size);
    ctx.bezierCurveTo(x, y + size, x + size / 2, y + (size + t) / 2, x + size / 2, y + t);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + t);
    ctx.closePath();
    ctx.fill();
}

function cxDrawStar(ctx, cx0, cy, spikes, outerR, innerR) {
    let rot = Math.PI / 2 * 3, x = cx0, y = cy;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx0, cy - outerR);
    for (let i = 0; i < spikes; i++) {
        x = cx0 + Math.cos(rot) * outerR; y = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x, y); rot += step;
        x = cx0 + Math.cos(rot) * innerR; y = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x, y); rot += step;
    }
    ctx.lineTo(cx0, cy - outerR);
    ctx.closePath();
    ctx.fill();
}

function cxLaunchConfetti(count = 90, originX = cxCanvasWidth / 2, originY = cxCanvasHeight / 2) {
    const colors = ['#7c2a2a', '#c99a3f', '#33473b', '#e3bd63', '#f6f1e4', '#ffffff', '#a67a2e'];
    const shapes = ['rect', 'rect', 'heart', 'star', 'sparkle'];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 4;
        cxCelebrationParticles.push({
            x: originX, y: originY,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 5,
            gravity: 0.25, size: Math.random() * 10 + 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.2,
            alpha: 1, decay: Math.random() * 0.008 + 0.005
        });
    }
}

function cxLaunchFirework() {
    const startX = Math.random() * (cxCanvasWidth * 0.8) + cxCanvasWidth * 0.1;
    const targetY = Math.random() * (cxCanvasHeight * 0.4) + cxCanvasHeight * 0.15;
    const colors = ['#7c2a2a', '#c99a3f', '#e3bd63', '#33473b', '#a67a2e'];
    cxFireworks.push({
        x: startX, y: cxCanvasHeight,
        vx: (Math.random() - 0.5) * 2, vy: -(Math.random() * 4 + 10),
        targetY, color: colors[Math.floor(Math.random() * colors.length)], exploded: false
    });
}

function cxCreateFireworkBurst(x, y, color) {
    const count = 50;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + (Math.random() * 0.2);
        const speed = Math.random() * 7 + 2;
        cxCelebrationParticles.push({
            x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            gravity: 0.12, size: Math.random() * 6 + 3, color,
            shape: Math.random() > 0.4 ? 'sparkle' : 'star',
            rotation: 0, rotSpeed: 0, alpha: 1, decay: Math.random() * 0.015 + 0.01
        });
    }
}

function cxLaunchCelebration() {
    cxLaunchConfetti(120, cxCanvasWidth / 2, cxCanvasHeight * 0.4);
    for (let i = 0; i < 4; i++) setTimeout(cxLaunchFirework, i * 350);
}

/* ---------- STAGE CONTROLLER ---------- */
function cxSwitchStage(fromStage, toStage) {
    fromStage.classList.remove('active-stage');
    setTimeout(() => {
        fromStage.classList.add('hidden-stage');
        toStage.classList.remove('hidden-stage');
        void toStage.offsetWidth;
        toStage.classList.add('active-stage');
        resizeCxCanvases();
        if (cx.root) cx.root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 600);
}

function cxOpenGift() {
    if (cxState.isBoxOpen) return;
    cxState.isBoxOpen = true;

    cx.giftTapHint.style.display = 'none';
    cx.giftBoxWrapper.classList.add('opening');

    const rect = cx.giftBoxWrapper.getBoundingClientRect();
    const local = cxToLocal(rect.left + rect.width / 2, rect.top + rect.height / 2 - 40);

    setTimeout(() => {
        cx.giftBoxWrapper.classList.add('box-opened');
        cxLaunchConfetti(80, local.x, local.y);
    }, 450);

    setTimeout(() => { cxRevealCake(); }, 1600);
}

function cxRevealCake() {
    cxSwitchStage(cx.giftStage, cx.cakeStage);
    cx.recipientNameDisplay.textContent = birthdayName;
    setTimeout(() => { cxLaunchConfetti(50, cxCanvasWidth / 2, cxCanvasHeight * 0.35); }, 800);
}

/* Candles, blow, and cut keep their full visual animation + confetti —
   only the sound effects tied to these specific actions are muted.
   Background music (top-right toggle) is unaffected. */
function cxLightCandles() {
    if (cxState.candlesLit) return;
    cxState.candlesLit = true;
    cx.lightCandlesBtn.classList.add('hidden');

    cx.flames.forEach((flame, index) => {
        setTimeout(() => {
            flame.classList.add('lit');
            const flameRect = flame.getBoundingClientRect();
            const local = cxToLocal(flameRect.left + flameRect.width / 2, flameRect.top);
            cxLaunchConfetti(12, local.x, local.y);
        }, index * 400);
    });

    setTimeout(() => {
        cx.cakeInstruction.textContent = "Now make a wish and blow the candles 💨";
        cx.blowControls.classList.remove('hidden');
        cxStartBlowDetection();
    }, 1500);
}

function cxStartBlowDetection() {
    if (cxState.candlesBlown || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cx.micStatusText.textContent = "Tap the button below to blow! 💨";
        return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
            cxState.micStream = stream;
            cxState.micListening = true;
            cx.micStatusText.textContent = "Mic active! Blow directly on your screen/mic 💨";

            const micCtx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = micCtx.createAnalyser();
            const microphone = micCtx.createMediaStreamSource(stream);
            analyser.fftSize = 512;
            microphone.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function checkAudioLevel() {
                if (!cxState.micListening || cxState.candlesBlown) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
                const average = sum / bufferLength;
                if (average > 55) {
                    cxExtinguishCandles();
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                requestAnimationFrame(checkAudioLevel);
            }
            checkAudioLevel();
        })
        .catch(() => {
            cx.micStatusText.textContent = "Tap the button below to blow! 💨";
        });
}

function cxExtinguishCandles() {
    if (cxState.candlesBlown) return;
    cxState.candlesBlown = true;
    cxState.micListening = false;

    cx.flames.forEach(flame => flame.classList.remove('lit'));
    cx.candleItems.forEach(item => item.classList.add('smoke-rise'));

    cx.blowControls.classList.add('hidden');
    cx.cakeInstruction.textContent = "Wish made! Now let's cut the cake! 🎂";

    setTimeout(() => {
        cxLaunchConfetti(45, cxCanvasWidth / 2, cxCanvasHeight * 0.4);
        cx.cakeKnife.classList.add('visible');
        cx.cutCakeBtn.classList.remove('hidden');
    }, 900);
}

function cxCutCake() {
    if (cxState.cakeCut) return;
    cxState.cakeCut = true;
    cx.cutCakeBtn.classList.add('hidden');
    cx.cakeKnife.classList.add('cutting');

    setTimeout(() => {
        cx.cakeStructure.classList.add('cake-cut-active');
        cxLaunchCelebration();
        cx.cakeInstruction.textContent = "Slice shared with love! ❤️";
        cx.goToMemoriesBtn.classList.remove('hidden');
    }, 700);
}

function cxPopulateMemories() {
    cx.polaroidGallery.innerHTML = '';
    const rotations = [-3, 2.5, -2, 3, -2.5, 2];

    memoryImages.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'polaroid-card';
        card.style.transform = `rotate(${rotations[index % rotations.length]}deg)`;
        card.innerHTML = `
            <div class="card-tape"></div>
            <div class="photo-wrapper"><img src="${item.url}" alt="Memory ${index + 1}" loading="lazy"></div>
            <p class="photo-caption">${item.caption}</p>
        `;
        card.addEventListener('click', () => {
            const cardRect = card.getBoundingClientRect();
            const local = cxToLocal(cardRect.left + 100, cardRect.top + 100);
            cxLaunchConfetti(15, local.x, local.y);
        });
        cx.polaroidGallery.appendChild(card);
    });
}

function cxShowMemories() {
    cxPopulateMemories();
    cxSwitchStage(cx.cakeStage, cx.memoryStage);
}

/* Turn **bold** markers into <strong>, keep line breaks (the CSS on
   .letter-body-text uses white-space: pre-line to render them). */
function cxFormatLetter(text) {
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return escaped.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
}

function cxShowLetterStage() {
    cx.letterNameDisplay.textContent = birthdayName;
    cx.letterBodyContent.innerHTML = cxFormatLetter(birthdayMessage);
    cxSwitchStage(cx.memoryStage, cx.letterStage);
}

function cxOpenLetter() {
    if (cxState.envelopeOpen) return;
    cxState.envelopeOpen = true;

    cx.envelope3D.classList.add('envelope-open');
    cx.envelopeHint.style.display = 'none';
    cxLaunchConfetti(60, cxCanvasWidth / 2, cxCanvasHeight * 0.45);

    // No button here — the letter is long, so give plenty of quiet
    // reading time before moving on to the finale by itself.
    setTimeout(() => { cxShowFinalScreen(); }, 60000);
}

function cxShowFinalScreen() {
    cx.finaleNameDisplay.textContent = birthdayName;
    cxSwitchStage(cx.letterStage, cx.finalStage);
    setTimeout(() => { cxLaunchCelebration(); }, 600);
}

function cxReplayExperience() {
    cxState.isBoxOpen = false;
    cxState.candlesLit = false;
    cxState.candlesBlown = false;
    cxState.cakeCut = false;
    cxState.envelopeOpen = false;

    cx.giftTapHint.style.display = 'flex';
    cx.giftBoxWrapper.classList.remove('opening', 'box-opened');
    cx.flames.forEach(f => f.classList.remove('lit'));
    cx.candleItems.forEach(item => item.classList.remove('smoke-rise'));
    cx.cakeStructure.classList.remove('cake-cut-active');
    cx.cakeKnife.classList.remove('visible', 'cutting');
    cx.cakeInstruction.textContent = "Make a wish... ✨";
    cx.lightCandlesBtn.classList.remove('hidden');
    cx.blowControls.classList.add('hidden');
    cx.cutCakeBtn.classList.add('hidden');
    cx.goToMemoriesBtn.classList.add('hidden');

    cx.envelope3D.classList.remove('envelope-open');
    cx.envelopeHint.style.display = 'block';

    cxSwitchStage(cx.finalStage, cx.giftStage);
}

function initCxEventListeners() {
    if (!cx.giftBoxWrapper) return; // celebration section not present

    cx.giftBoxWrapper.addEventListener('click', cxOpenGift);
    cx.giftBoxWrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cxOpenGift(); }
    });

    cx.lightCandlesBtn.addEventListener('click', cxLightCandles);
    cx.blowCandlesBtn.addEventListener('click', cxExtinguishCandles);
    cx.cutCakeBtn.addEventListener('click', cxCutCake);
    cx.goToMemoriesBtn.addEventListener('click', cxShowMemories);

    cx.goToLetterBtn.addEventListener('click', cxShowLetterStage);

    cx.envelope3D.addEventListener('click', cxOpenLetter);
    cx.envelope3D.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cxOpenLetter(); }
    });

    cx.replayExperienceBtn.addEventListener('click', cxReplayExperience);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('celebration')) return;
    initCxCanvases();
    initCxEventListeners();
});
