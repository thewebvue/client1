/* =========================================================
   THE MAN BEHIND THE NAME — Manikandan
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    runOpeningSequence();
    duplicateFilmstrip();
    initQuiz();
    initPuzzle();
    initTimelineReveal();
    initTypewriter();
    initNavToggle();
    initGalleryCarousel();
});

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

/* ---------- GALLERY: swipeable coverflow carousel ---------- */
function initGalleryCarousel() {
    const viewport = document.getElementById('carouselViewport');
    const track = document.getElementById('carouselTrack');
    const dotsWrap = document.getElementById('carouselDots');
    const swipeHint = document.getElementById('swipeHint');
    if (!viewport || !track) return;

    const originalSlides = Array.from(track.children);
    const total = originalSlides.length;
    if (total === 0) return;

    // Clone the last slide to the front, and the first slide to the back,
    // so wrapping past either end is a seamless continuation (like the
    // Fav filmstrip) instead of a visible jump back to the start.
    const canLoop = total > 1;
    if (canLoop) {
        const firstClone = originalSlides[0].cloneNode(true);
        const lastClone = originalSlides[total - 1].cloneNode(true);
        firstClone.setAttribute('aria-hidden', 'true');
        lastClone.setAttribute('aria-hidden', 'true');
        track.insertBefore(lastClone, originalSlides[0]);
        track.appendChild(firstClone);
    }

    const allSlides = Array.from(track.children);
    let trackIndex = canLoop ? 1 : 0; // position within allSlides that is on screen
    let autoplayTimer = null;
    let hintDismissed = false;

    // Build dots — one per REAL photo, not per clone
    const dots = [];
    originalSlides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.classList.add('dot');
        dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
        dot.addEventListener('click', () => {
            trackIndex = canLoop ? i + 1 : i;
            update();
            restartAutoplay();
            dismissHint();
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
    });

    function dismissHint() {
        if (hintDismissed || !swipeHint) return;
        hintDismissed = true;
        swipeHint.classList.add('dismissed');
    }

    function realIndex() {
        if (!canLoop) return trackIndex;
        return ((trackIndex - 1) + total) % total;
    }

    function slideWidth() {
        return viewport.clientWidth;
    }

    function update(withTransition = true) {
        if (!withTransition) track.style.transition = 'none';
        track.style.transform = `translateX(${-trackIndex * slideWidth()}px)`;
        if (!withTransition) {
            void track.offsetHeight; // force reflow before re-enabling transition
            track.style.transition = '';
        }
        allSlides.forEach((slide, i) => slide.classList.toggle('active', i === trackIndex));
        const ri = realIndex();
        dots.forEach((dot, i) => dot.classList.toggle('active', i === ri));
    }

    function next() { trackIndex++; update(); }
    function prev() { trackIndex--; update(); }

    // When a transition into a cloned slide finishes, silently snap to the
    // matching real slide with no animation — the clone looks identical,
    // so the loop feels continuous instead of ending.
    track.addEventListener('transitionend', (e) => {
        if (e.propertyName !== 'transform' || !canLoop) return;
        if (trackIndex === allSlides.length - 1) {
            trackIndex = 1;
            update(false);
        } else if (trackIndex === 0) {
            trackIndex = total;
            update(false);
        }
    });

    // Keyboard navigation when the carousel is focused
    viewport.setAttribute('tabindex', '0');
    viewport.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { next(); restartAutoplay(); dismissHint(); }
        if (e.key === 'ArrowLeft') { prev(); restartAutoplay(); dismissHint(); }
    });

    // Swipe / drag support (touch + mouse via Pointer Events).
    // A drag ever only advances exactly one photo, however far you pull.
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;

    viewport.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        currentTranslate = 0;
        track.style.transition = 'none';
        viewport.setPointerCapture(e.pointerId);
        stopAutoplay();
        dismissHint();
    });

    viewport.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        currentTranslate = e.clientX - startX;
        const base = -trackIndex * slideWidth();
        track.style.transform = `translateX(${base + currentTranslate}px)`;
    });

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        track.style.transition = '';
        const threshold = 50;
        if (currentTranslate < -threshold) next();
        else if (currentTranslate > threshold) prev();
        else update();
        currentTranslate = 0;
        restartAutoplay();
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('pointerleave', () => { if (isDragging) endDrag(); });

    // Gentle autoplay that yields to the user on any interaction
    function startAutoplay() {
        if (!canLoop) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        autoplayTimer = setInterval(next, 4500);
    }
    function stopAutoplay() { clearInterval(autoplayTimer); }
    function restartAutoplay() { stopAutoplay(); startAutoplay(); }

    viewport.addEventListener('mouseenter', stopAutoplay);
    viewport.addEventListener('mouseleave', restartAutoplay);

    window.addEventListener('resize', () => update(false));

    update(false);
    startAutoplay();
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
function openModal(src, captionText, type = 'image') {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    const modalVideo = document.getElementById("modalVideo");
    const caption = document.getElementById("modalCaption");

    if(!modal) return;
    modal.style.display = "block";
    if(caption) caption.innerHTML = captionText;

    if (type === 'video') {
        if(modalImg) modalImg.style.display = "none";
        if(modalImg) modalImg.src = "";
        if(modalVideo) {
            modalVideo.style.display = "block";
            modalVideo.src = src;
            modalVideo.currentTime = 0;
            modalVideo.play().catch(() => {});
        }
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

function closeModal() {
    const modal = document.getElementById("imageModal");
    const modalVideo = document.getElementById("modalVideo");
    const specialAudio = document.getElementById("specialAudio");
    
    if (modalVideo) modalVideo.pause();
    if (specialAudio) specialAudio.pause();
    if (modal) modal.style.display = "none";
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

/* ---------- FINALE: typewriter dedication ---------- */
function initTypewriter() {
    const el = document.getElementById('typewriterText');
    const wish = document.getElementById('bigWish');
    if (!el) return;

    const lines = [
        "En CA… En Director… En Forever ❤️",
        "Accounts-la numbers-a thedi,",
        "Life-la dreams-a thedi,",
        "Oru pakkam CA aaga pora nee…",
        "Innor pakkam Cinema-va direct panna pora nee…",
        "",
        "Books un kaiyila irundhaalum,",
        "Un manasula eppovume oru screenplay odudhu…",
        "Balance sheet-la profit & loss paakra nee,",
        "Aana en life-la vandhu",
        "Profit mattum kudutha manushan nee. ❤️",
        "",
        "CA exam-ku padikkira ovvoru iravum,",
        "Un kanavukkaaga nee podra ovvoru muyarchiyum,",
        "Oru naal…",
        "“Action!” nu nee sollumbodhu",
        "Andha screen-la theriyum…",
        "Nee kadandhu vandha paadhai ellam. 🎬",
        "",
        "Innaiku birthday…",
        "Aana idhu just oru birthday illa…",
        "Un dreams rendu perum",
        "Orey naal-la celebrate panna vendiya beginning.",
        "",
        "Oru naal naan proud-a sollanum…",
        "",
        "“Avan en CA mattum illa…",
        "Avan oru Director.",
        "Avan en Director mattum illa…",
        "Avan dhaan en Forever.” ❤️",
        "",
        "Un calculations ellam success-a balance aaganum…",
        "Un stories ellam blockbuster-a aaganum…",
        "Un dreams ellam reality-a maaranum…",
        "",
        "And most importantly…",
        "",
        "Un life oda beautiful-aana",
        "every frame-la…",
        "Naanum irukkanum. ❤️🎬",
        "",
        "Happy Birthday, En CA…",
        "My Director…",
        "My Dreamer…",
        "My Forever. 🫶🏻"
    ];
    
    const fullText = lines.join('\n');
    let started = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !started) {
                started = true;
                typeText(el, fullText, wish);
            }
        });
    }, { threshold: 0.5 });
    observer.observe(el);
}

function typeText(el, text, wish) {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        el.innerHTML = text.replace(/\n/g, '<br>');
        if (wish) wish.classList.add('show');
        return;
    }

    let i = 0;
    const cursor = '<span class="tw-cursor"></span>';
    const speed = 28;

    function step() {
        if (i <= text.length) {
            const shown = text.substring(0, i).replace(/\n/g, '<br>');
            el.innerHTML = shown + cursor;
            i++;
            setTimeout(step, speed);
        } else {
            el.innerHTML = text.replace(/\n/g, '<br>');
            if (wish) setTimeout(() => wish.classList.add('show'), 300);
        }
    }
    step();
}