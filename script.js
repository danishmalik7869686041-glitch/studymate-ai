// ============================================================
// STUDYMATE AI - COMPLETE SCRIPT
// ============================================================


// ============================================================
// ASK STUDYMATE
// ============================================================

async function askStudyMate() {

    const input = document.getElementById("question");
    const result = document.getElementById("chatBox");

    if (!input || !result) return;

    const question = input.value.trim();

    if (!question) {
        result.innerHTML =
            "⚠️ Pehle apna question likho.";
        return;
    }

    result.innerHTML += `
        <div class="user-message">
            👤 ${escapeHTML(question)}
        </div>
    `;

    input.value = "";

    result.innerHTML += `
        <div class="ai-message loading-message">
            🤖 Thinking<span class="dots">...</span>
        </div>
    `;

    try {

        const response = await fetch("/ask", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                question: question
            })
        });

        if (!response.ok) {
            throw new Error(
                "Server error: " + response.status
            );
        }

        const data =
            await response.json();

        const messages =
            result.querySelectorAll(".ai-message");

        if (messages.length > 0) {

            messages[messages.length - 1]
                .textContent =
                "🤖 " +
                (data.answer ||
                    "AI se answer nahi mila.");
        }

    } catch (error) {

        console.error(
            "Ask error:",
            error
        );

        const messages =
            result.querySelectorAll(".ai-message");

        if (messages.length > 0) {

            messages[messages.length - 1]
                .textContent =
                "❌ AI se connect nahi ho pa raha.";
        }
    }
}


// ============================================================
// CREATE STUDY PLAN
// ============================================================

async function createPlan() {

    const subjectInput =
        document.getElementById("subject");

    const daysInput =
        document.getElementById("days");

    const result =
        document.getElementById("result");

    if (!subjectInput || !daysInput || !result) {
        return;
    }

    const subject =
        subjectInput.value.trim();

    const days =
        daysInput.value.trim();

    if (!subject || !days) {

        result.innerHTML =
            "⚠️ Subject aur days dono enter karo.";

        return;
    }

    result.innerHTML = `
        <div class="loading-box">
            🤖 Study plan bana raha hoon
            <span class="dots">...</span>
        </div>
    `;

    try {

        const response =
            await fetch("/create-plan", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    subject: subject,
                    days: days
                })
            });

        if (!response.ok) {
            throw new Error(
                "Server error: " + response.status
            );
        }

        const data =
            await response.json();

        if (data.plan) {

            result.innerHTML = `
                <div class="plan-result">

                    <h2>
                        📚 Your Study Plan
                    </h2>

                    <pre>
${escapeHTML(data.plan)}
                    </pre>

                </div>
            `;

        } else {

            result.innerHTML =
                "❌ Study plan nahi ban paya.";
        }

    } catch (error) {

        console.error(
            "Study Plan error:",
            error
        );

        result.innerHTML =
            "❌ AI se connect nahi ho pa raha.";
    }
}


// ============================================================
// QUIZ VARIABLES
// ============================================================

let currentQuiz = [];
let currentQuestion = 0;
let score = 0;
let quizAnswered = false;


// ============================================================
// GENERATE QUIZ
// ============================================================

async function generateQuiz() {

    const subjectInput =
        document.getElementById("quizSubject");

    const questionsInput =
        document.getElementById("quizQuestions");

    const result =
        document.getElementById("quizResult");

    if (!subjectInput ||
        !questionsInput ||
        !result) {

        return;
    }

    const subject =
        subjectInput.value.trim();

    const questions =
        questionsInput.value.trim();

    if (!subject || !questions) {

        result.innerHTML =
            "⚠️ Quiz topic aur questions number enter karo.";

        return;
    }

    result.innerHTML = `
        <div class="quiz-result">

            <div class="loading-box">
                🧠 Quiz bana raha hoon
                <span class="dots">...</span>
            </div>

        </div>
    `;

    try {

        const response =
            await fetch("/generate-quiz", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    subject: subject,
                    questions: questions
                })
            });

        if (!response.ok) {

            throw new Error(
                "Server error: " + response.status
            );
        }

        const data =
            await response.json();

        if (data.quiz) {

            result.innerHTML = `
                <div class="quiz-result">

                    <h2>
                        🧠 Your Quiz
                    </h2>

                    <div
                        id="quizQuestionsBox">
                    </div>

                </div>
            `;

            displayQuiz(data.quiz);

        } else {

            result.innerHTML =
                "❌ Quiz nahi ban paya.";
        }

    } catch (error) {

        console.error(
            "Quiz error:",
            error
        );

        result.innerHTML =
            "❌ AI se connect nahi ho pa raha.";
    }
}


// ============================================================
// DISPLAY QUIZ
// ============================================================

function displayQuiz(quizText) {

    try {

        let quizData;

        if (typeof quizText === "object") {

            quizData = quizText;

        } else {

            let cleaned =
                String(quizText)
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim();

            quizData =
                JSON.parse(cleaned);
        }

        currentQuiz =
            Array.isArray(quizData.questions)
                ? quizData.questions
                : [];

        if (
            currentQuiz.length === 0
        ) {

            throw new Error(
                "Questions nahi mile."
            );
        }

        currentQuestion = 0;
        score = 0;
        quizAnswered = false;

        showQuestion();

    } catch (error) {

        console.error(
            "Quiz format error:",
            error
        );

        const box =
            document.getElementById(
                "quizQuestionsBox"
            );

        if (box) {

            box.innerHTML =
                "❌ Quiz format samajh nahi aaya.";
        }
    }
}


// ============================================================
// SHOW QUESTION
// ============================================================

function showQuestion() {

    const box =
        document.getElementById(
            "quizQuestionsBox"
        );

    if (!box) return;

    const q =
        currentQuiz[currentQuestion];

    if (!q) {

        showScore();

        return;
    }

    quizAnswered = false;

    const options =
        Array.isArray(q.options)
            ? q.options
            : Array.isArray(q.choices)
                ? q.choices
                : [];

    const questionText =
        q.question ||
        q.text ||
        q.q ||
        "";

    const progress =
        Math.round(
            (currentQuestion /
                currentQuiz.length) *
            100
        );

    box.innerHTML = `

        <div class="quiz-question">

            <div class="quiz-progress-info">

                <span>
                    Question
                    ${currentQuestion + 1}
                </span>

                <span>
                    ${currentQuiz.length}
                    Questions
                </span>

            </div>


            <div class="quiz-progress-container">

                <div
                    class="quiz-progress-fill"
                    style="width:${progress}%"
                ></div>

            </div>


            <h3>
                Question
                ${currentQuestion + 1}
                / ${currentQuiz.length}
            </h3>


            <h2>
                ${escapeHTML(questionText)}
            </h2>


            <div class="options">

                ${
                    options
                        .map(
                            (option, index) => `

                                <button
                                    class="quiz-option"
                                    data-index="${index}"
                                    onclick="selectAnswer(${index})"
                                >

                                    <span
                                        class="option-letter"
                                    >
                                        ${
                                            String.fromCharCode(
                                                65 + index
                                            )
                                        }
                                    </span>

                                    <span
                                        class="option-text"
                                    >
                                        ${escapeHTML(option)}
                                    </span>

                                </button>
                            `
                        )
                        .join("")
                }

            </div>


            <div
                id="answerFeedback"
            ></div>

        </div>
    `;
}


// ============================================================
// SELECT ANSWER
// ============================================================

function selectAnswer(selected) {

    if (quizAnswered) return;

    const q =
        currentQuiz[currentQuestion];

    if (!q) return;

    quizAnswered = true;

    const options =
        Array.isArray(q.options)
            ? q.options
            : Array.isArray(q.choices)
                ? q.choices
                : [];

    let correct =
        q.answer ??
        q.correctAnswer ??
        q.correctIndex ??
        q.correct;

    if (
        typeof correct === "string"
    ) {

        const value =
            correct.trim();

        if (/^[A-D]$/i.test(value)) {

            correct =
                value
                    .toUpperCase()
                    .charCodeAt(0) - 65;

        } else if (
            options.includes(value)
        ) {

            correct =
                options.indexOf(value);

        } else {

            correct =
                Number(value);
        }

    } else {

        correct =
            Number(correct);
    }

    if (
        Number.isNaN(correct)
    ) {

        correct = 0;
    }

    const box =
        document.getElementById(
            "quizQuestionsBox"
        );

    if (!box) return;

    const buttons =
        box.querySelectorAll(
            ".quiz-option"
        );

    buttons.forEach(
        button => {
            button.disabled = true;
        }
    );

    const selectedButton =
        box.querySelector(
            `.quiz-option[data-index="${selected}"]`
        );

    const correctButton =
        box.querySelector(
            `.quiz-option[data-index="${correct}"]`
        );

    const feedback =
        document.getElementById(
            "answerFeedback"
        );


    if (selected === correct) {

        score++;

        if (selectedButton) {

            selectedButton.classList.add(
                "correct"
            );
        }

        if (feedback) {

            feedback.innerHTML = `
                <div
                    class="answer-feedback
                           correct-feedback"
                >

                    <strong>
                        ✓ Correct!
                    </strong>

                    <span>
                        Great job! Keep going.
                    </span>

                </div>
            `;
        }

    } else {

        if (selectedButton) {

            selectedButton.classList.add(
                "wrong"
            );
        }

        if (correctButton) {

            correctButton.classList.add(
                "correct"
            );
        }

        if (feedback) {

            feedback.innerHTML = `
                <div
                    class="answer-feedback
                           wrong-feedback"
                >

                    <strong>
                        ✕ Wrong answer!
                    </strong>

                    <span>
                        Correct answer:
                        <b>
                            ${escapeHTML(
                                options[correct] ||
                                ""
                            )}
                        </b>
                    </span>

                </div>
            `;
        }
    }


    if (feedback) {

        const nextButton =
            document.createElement(
                "button"
            );

        nextButton.className =
            "next-question-btn";

        nextButton.textContent =
            currentQuestion ===
            currentQuiz.length - 1
                ? "🏆 Finish Quiz"
                : "Next Question →";

        nextButton.onclick =
            nextQuestion;

        feedback.appendChild(
            nextButton
        );
    }
}


// ============================================================
// NEXT QUESTION
// ============================================================

function nextQuestion() {

    currentQuestion++;

    if (
        currentQuestion <
        currentQuiz.length
    ) {

        showQuestion();

    } else {

        showScore();
    }
}


// ============================================================
// SHOW SCORE
// ============================================================

function showScore() {

    const box =
        document.getElementById(
            "quizQuestionsBox"
        );

    if (!box) return;

    const total =
        currentQuiz.length;

    const percentage =
        total > 0
            ? Math.round(
                (score / total) * 100
            )
            : 0;

    let message = "";

    if (percentage === 100) {

        message =
            "🏆 Perfect! Excellent work!";

    } else if (percentage >= 75) {

        message =
            "🎉 Great job! Keep it up!";

    } else if (percentage >= 50) {

        message =
            "👍 Good effort! Keep practicing!";

    } else {

        message =
            "💪 Don't give up! Practice more!";
    }

    box.innerHTML = `

        <div class="quiz-score">

            <div class="score-icon">
                🏆
            </div>

            
            <h2>
                🎉 Quiz Complete!
            </h2>

            <h1>
                🎯 Your Score:
                ${score}/${total}
            </h1>

            <h2>
                📊 ${percentage}%
            </h2>

            <p>
                ${message}
            </p>

            <button
                onclick="generateQuiz()"
            >
                🔄 Try Again
            </button>

        </div>
    `;
}


// ============================================================
// AI FLASHCARDS
// ============================================================

async function generateFlashcards() {

    const subjectInput =
        document.getElementById(
            "flashcardSubject"
        );

    const countInput =
        document.getElementById(
            "flashcardCount"
        );

    const result =
        document.getElementById(
            "flashcardResult"
        );

    if (
        !subjectInput ||
        !countInput ||
        !result
    ) {
        return;
    }

    const subject =
        subjectInput.value.trim();

    const count =
        Number(
            countInput.value
        );

    if (!subject || !count) {

        result.innerHTML =
            "⚠️ Topic aur flashcards ki number dono enter karo.";

        return;
    }

    if (
        count < 1 ||
        count > 20
    ) {

        result.innerHTML =
            "⚠️ Flashcards ki number 1 se 20 ke beech rakho.";

        return;
    }

    result.innerHTML = `
        <div class="loading-box">
            🃏 Flashcards bana raha hoon
            <span class="dots">...</span>
        </div>
    `;

    try {

        const prompt = `
Create ${count} educational flashcards about "${subject}".

Return ONLY valid JSON.

Use this exact format:

{
  "flashcards": [
    {
      "question": "Question here",
      "answer": "Answer here"
    }
  ]
}

Make the questions useful for a student.
Keep answers clear, accurate and easy to revise.
`;

        const response =
            await fetch("/ask", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    question: prompt
                })
            });

        if (!response.ok) {

            throw new Error(
                "Server error: " +
                response.status
            );
        }

        const data =
            await response.json();

        let answer =
            data.answer || "";

        answer =
            answer
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .trim();

        const flashcardData =
            JSON.parse(answer);

        if (
            !flashcardData.flashcards ||
            !Array.isArray(
                flashcardData.flashcards
            )
        ) {

            throw new Error(
                "Flashcards nahi mile."
            );
        }

        displayFlashcards(
            flashcardData.flashcards
        );

    } catch (error) {

        console.error(
            "Flashcard error:",
            error
        );

        result.innerHTML = `
            <div class="loading-box">

                ❌ Flashcards generate nahi ho paaye.

                <br><br>

                Please dobara try karo.

            </div>
        `;
    }
}


// ============================================================
// DISPLAY FLASHCARDS
// ============================================================

function displayFlashcards(
    flashcards
) {

    const result =
        document.getElementById(
            "flashcardResult"
        );

    if (!result) return;

    result.innerHTML = `

        <div class="flashcards-container">

            <h2>
                🃏 Your Flashcards
            </h2>

            <p class="flashcard-info">
                Click a card to see the answer.
            </p>

            <div class="flashcards-grid">

                ${
                    flashcards
                        .map(
                            (card, index) => `

                                <div
                                    class="flashcard"
                                    onclick="this.classList.toggle('flipped')"
                                >

                                    <div
                                        class="flashcard-inner"
                                    >

                                        <div
                                            class="flashcard-front"
                                        >

                                            <span
                                                class="flashcard-number"
                                            >
                                                Card
                                                ${index + 1}
                                            </span>

                                            <h3>
                                                ${escapeHTML(
                                                    card.question ||
                                                    ""
                                                )}
                                            </h3>

                                            <p>
                                                👆 Click to reveal answer
                                            </p>

                                        </div>


                                        <div
                                            class="flashcard-back"
                                        >

                                            <span
                                                class="flashcard-number"
                                            >
                                                Answer
                                            </span>

                                            <p>
                                                ${escapeHTML(
                                                    card.answer ||
                                                    ""
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                </div>
                            `
                        )
                        .join("")
                }

            </div>

        </div>
    `;
}


// ============================================================
// PDF UPLOAD & SUMMARY
// ============================================================

async function uploadPDF() {

    const fileInput =
        document.getElementById(
            "pdfFile"
        );

    const result =
        document.getElementById(
            "pdfResult"
        );

    if (
        !fileInput ||
        !result
    ) {
        return;
    }

    if (
        !fileInput.files.length
    ) {

        result.innerHTML =
            "⚠️ Pehle PDF select karo.";

        return;
    }

    const file =
        fileInput.files[0];

    if (
        file.type !==
        "application/pdf"
    ) {

        result.innerHTML =
            "⚠️ Sirf PDF file upload karo.";

        return;
    }

    const formData =
        new FormData();

    formData.append(
        "pdf",
        file
    );

    result.innerHTML = `
        <div class="loading-box">
            🤖 PDF read kar raha hoon
            <span class="dots">...</span>
        </div>
    `;

    try {

        const response =
            await fetch(
                "/upload-pdf",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "PDF process failed"
            );
        }

        if (data.summary) {

            result.innerHTML = `
                <div class="plan-result">

                    <h2>
                        📚 PDF Summary
                    </h2>

                    <pre>
${escapeHTML(data.summary)}
                    </pre>

                </div>
            `;

        } else {

            result.innerHTML =
                "❌ PDF summary nahi mili.";
        }

    } catch (error) {

        console.error(
            "PDF error:",
            error
        );

        result.innerHTML =
            "❌ PDF process nahi ho pa rahi.";
    }
}


// ============================================================
// DARK / LIGHT MODE
// ============================================================

function toggleTheme() {

    document.body.classList.toggle(
        "dark-mode"
    );

    const button =
        document.getElementById(
            "themeToggle"
        );

    if (!button) return;

    if (
        document.body.classList.contains(
            "dark-mode"
        )
    ) {

        button.textContent =
            "☀️ Light Mode";

        localStorage.setItem(
            "theme",
            "dark"
        );

    } else {

        button.textContent =
            "🌙 Dark Mode";

        localStorage.setItem(
            "theme",
            "light"
        );
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text ?? "";

    return div.innerHTML;
}


// ============================================================
// PAGE LOAD
// ============================================================

window.addEventListener(
    "load",
    function () {

        const themeButton =
            document.getElementById(
                "themeToggle"
            );

        if (
            localStorage.getItem(
                "theme"
            ) === "dark"
        ) {

            document.body.classList.add(
                "dark-mode"
            );

            if (themeButton) {

                themeButton.textContent =
                    "☀️ Light Mode";
            }

        } else {

            if (themeButton) {

                themeButton.textContent =
                    "🌙 Dark Mode";
            }
        }
    }
);


// ============================================================
// ENTER KEY SUPPORT
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const questionInput =
            document.getElementById(
                "question"
            );

        if (questionInput) {

            questionInput.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        askStudyMate();
                    }
                }
            );
        }


        const subjectInput =
            document.getElementById(
                "subject"
            );

        if (subjectInput) {

            subjectInput.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        createPlan();
                    }
                }
            );
        }


        const daysInput =
            document.getElementById(
                "days"
            );

        if (daysInput) {

            daysInput.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        createPlan();
                    }
                }
            );
        }


        const quizSubject =
            document.getElementById(
                "quizSubject"
            );

        if (quizSubject) {

            quizSubject.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        generateQuiz();
                    }
                }
            );
        }


        const quizQuestions =
            document.getElementById(
                "quizQuestions"
            );

        if (quizQuestions) {

            quizQuestions.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        generateQuiz();
                    }
                }
            );
        }


        const flashcardSubject =
            document.getElementById(
                "flashcardSubject"
            );

        if (flashcardSubject) {

            flashcardSubject.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        generateFlashcards();
                    }
                }
            );
        }


        const flashcardCount =
            document.getElementById(
                "flashcardCount"
            );

        if (flashcardCount) {

            flashcardCount.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        generateFlashcards();
                    }
                }
            );
        }


        const notesSubject =
            document.getElementById(
                "notesSubject"
            );

        if (notesSubject) {

            notesSubject.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        generateNotes();
                    }
                }
            );
        }

    }
);


// ============================================================
// PROGRESS DASHBOARD
// ============================================================

(function () {

    const DASHBOARD_KEY =
        "studymateDashboard";


    function getData() {

        try {

            const saved =
                localStorage.getItem(
                    DASHBOARD_KEY
                );

            if (saved) {

                const data =
                    JSON.parse(saved);

                return {

                    studySessions:
                        Number(
                            data.studySessions || 0
                        ),

                    quizCompleted:
                        Number(
                            data.quizCompleted || 0
                        ),

                    quizScores:
                        Array.isArray(
                            data.quizScores
                        )
                            ? data.quizScores
                            : [],

                    pdfCompleted:
                        Number(
                            data.pdfCompleted || 0
                        ),

                    studyStreak:
                        Number(
                            data.studyStreak || 0
                        ),

                    lastStudyDate:
                        data.lastStudyDate ||
                        null
                };
            }

        } catch (error) {

            console.error(
                "Dashboard data error:",
                error
            );
        }


        return {

            studySessions: 0,

            quizCompleted: 0,

            quizScores: [],

            pdfCompleted: 0,

            studyStreak: 0,

            lastStudyDate: null
        };
    }


    function saveData(data) {

        localStorage.setItem(
            DASHBOARD_KEY,
            JSON.stringify(data)
        );
    }


    function updateDashboard() {

        const data =
            getData();

        const sessions =
            document.getElementById(
                "studySessions"
            );

        const quizzes =
            document.getElementById(
                "quizCompleted"
            );

        const average =
            document.getElementById(
                "averageScore"
            );

        const pdfs =
            document.getElementById(
                "pdfCompleted"
            );

        const streak =
            document.getElementById(
                "studyStreak"
            );

        const progress =
            document.getElementById(
                "progressText"
            );

        const progressBar =
            document.getElementById(
                "overallProgress"
            );


        if (sessions) {

            sessions.textContent =
                data.studySessions;
        }


        if (quizzes) {

            quizzes.textContent =
                data.quizCompleted;
        }


        if (pdfs) {

            pdfs.textContent =
                data.pdfCompleted;
        }


        let avgScore = 0;

        if (
            data.quizScores.length > 0
        ) {

            const total =
                data.quizScores.reduce(
                    (
                        sum,
                        value
                    ) =>
                        sum +
                        Number(value),
                    0
                );

            avgScore =
                Math.round(
                    total /
                    data.quizScores.length
                );
        }


        if (average) {

            average.textContent =
                avgScore + "%";
        }


        if (streak) {

            streak.textContent =
                data.studyStreak +
                (
                    data.studyStreak === 1
                        ? " day"
                        : " days"
                );
        }


        const activities =
            data.studySessions +
            data.quizCompleted +
            data.pdfCompleted;


        const activityProgress =
            Math.min(
                100,
                Math.round(
                    (
                        activities /
                        15
                    ) * 100
                )
            );


        const overall =
            Math.round(
                (
                    activityProgress +
                    avgScore
                ) / 2
            );


        if (progress) {

            progress.textContent =
                overall + "%";
        }


        if (progressBar) {

            progressBar.style.width =
                overall + "%";
        }
    }


    function updateStreak(data) {

        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        if (!data.lastStudyDate) {

            data.studyStreak = 1;

            data.lastStudyDate =
                today;

            return;
        }


        if (
            data.lastStudyDate ===
            today
        ) {

            return;
        }


        const last =
            new Date(
                data.lastStudyDate
            );

        const current =
            new Date(today);


        const difference =
            Math.floor(
                (
                    current -
                    last
                ) /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        if (
            difference === 1
        ) {

            data.studyStreak += 1;

        } else {

            data.studyStreak = 1;
        }


        data.lastStudyDate =
            today;
    }


    function addStudySession() {

        const data =
            getData();

        data.studySessions += 1;

        updateStreak(data);

        saveData(data);

        updateDashboard();
    }


    function addPDF() {

        const data =
            getData();

        data.pdfCompleted += 1;

        updateStreak(data);

        saveData(data);

        updateDashboard();
    }


    function addQuiz(scoreValue) {

        const data =
            getData();

        data.quizCompleted += 1;

        data.quizScores.push(
            Number(scoreValue)
        );

        updateStreak(data);

        saveData(data);

        updateDashboard();
    }


    // ========================================================
    // WATCH STUDY PLAN
    // ========================================================

    function watchStudyPlan() {

        const result =
            document.getElementById(
                "result"
            );

        if (!result) return;

        let alreadyCounted =
            false;


        const observer =
            new MutationObserver(
                function () {

                    const plan =
                        result.querySelector(
                            ".plan-result"
                        );


                    if (
                        plan &&
                        !alreadyCounted
                    ) {

                        alreadyCounted =
                            true;

                        addStudySession();
                    }


                    if (!plan) {

                        alreadyCounted =
                            false;
                    }

                }
            );


        observer.observe(
            result,
            {
                childList: true,
                subtree: true
            }
        );
    }


    // ========================================================
    // WATCH PDF
    // ========================================================

    function watchPDF() {

        const result =
            document.getElementById(
                "pdfResult"
            );

        if (!result) return;

        let alreadyCounted =
            false;


        const observer =
            new MutationObserver(
                function () {

                    const summary =
                        result.querySelector(
                            ".plan-result"
                        );


                    if (
                        summary &&
                        !alreadyCounted
                    ) {

                        alreadyCounted =
                            true;

                        addPDF();
                    }


                    if (!summary) {

                        alreadyCounted =
                            false;
                    }

                }
            );


        observer.observe(
            result,
            {
                childList: true,
                subtree: true
            }
        );
    }


    // ========================================================
    // WATCH QUIZ
    // ========================================================

    function watchQuiz() {

        const result =
            document.getElementById(
                "quizResult"
            );

        if (!result) return;

        let lastScore =
            null;


        const observer =
            new MutationObserver(
                function () {

                    const scoreBox =
                        result.querySelector(
                            ".quiz-score"
                        );

                    if (!scoreBox) return;


                    const text =
                        scoreBox.innerText ||
                        "";


                    const match =
                        text.match(
                            /Your Score:\s*(\d+)\s*\/\s*(\d+)/i
                        );

                    if (!match) return;


                    const currentScore =
                        Number(
                            match[1]
                        );

                    const total =
                        Number(
                            match[2]
                        );

                    if (!total) return;


                    const percentage =
                        Math.round(
                            (
                                currentScore /
                                total
                            ) * 100
                        );


                    const uniqueScore =
                        currentScore +
                        "/" +
                        total;


                    if (
                        uniqueScore !==
                        lastScore
                    ) {

                        lastScore =
                            uniqueScore;

                        addQuiz(
                            percentage
                        );
                    }

                }
            );


        observer.observe(
            result,
            {
                childList: true,
                subtree: true
            }
        );
    }


    // ========================================================
    // START DASHBOARD
    // ========================================================

    function startDashboard() {

        updateDashboard();

        watchStudyPlan();

        watchPDF();

        watchQuiz();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            startDashboard
        );

    } else {

        startDashboard();
    }

})();


// ============================================================
// AI NOTES GENERATOR
// ============================================================

async function generateNotes() {

    const subjectInput =
        document.getElementById(
            "notesSubject"
        );

    const result =
        document.getElementById(
            "notesResult"
        );

    if (
        !subjectInput ||
        !result
    ) {

        console.error(
            "Notes elements nahi mile."
        );

        return;
    }


    const subject =
        subjectInput.value.trim();


    if (!subject) {

        result.innerHTML =
            "⚠️ Pehle topic enter karo.";

        return;
    }


    result.innerHTML = `
        <div class="loading-box">
            🤖 Notes bana raha hoon
            <span class="dots">...</span>
        </div>
    `;


    const prompt = `
Create clear, accurate and student-friendly study notes on:

"${subject}"

Return ONLY valid JSON.

Use this exact format:

{
  "title": "Topic Title",
  "overview": "Short and simple overview of the topic",
  "keyPoints": [
    "Important point 1",
    "Important point 2",
    "Important point 3",
    "Important point 4"
  ],
  "concepts": [
    {
      "heading": "Concept 1",
      "explanation": "Simple explanation"
    },
    {
      "heading": "Concept 2",
      "explanation": "Simple explanation"
    },
    {
      "heading": "Concept 3",
      "explanation": "Simple explanation"
    }
  ],
  "quickRevision": [
    "Quick revision point 1",
    "Quick revision point 2",
    "Quick revision point 3",
    "Quick revision point 4"
  ]
}

Rules:
- Use simple student-friendly language.
- Make the notes useful for exams.
- Keep explanations clear and concise.
- Do not use markdown.
- Return valid JSON only.
`;


    try {

        const response =
            await fetch(
                "/ask",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        question: prompt
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Server error: " +
                response.status
            );
        }


        const data =
            await response.json();


        let answer =
            data.answer || "";


        answer =
            answer
                .replace(
                    /```json/gi,
                    ""
                )
                .replace(
                    /```/g,
                    ""
                )
                .trim();


        const notes =
            JSON.parse(answer);


        if (!notes) {

            throw new Error(
                "Notes nahi mile."
            );
        }


        result.innerHTML = `

            <div class="notes-result">


                <div class="notes-header">

                    <span class="notes-badge">
                        AI NOTES
                    </span>

                    <h2>
                        📚 ${
                            escapeHTML(
                                notes.title ||
                                subject
                            )
                        }
                    </h2>

                </div>


                <div class="notes-overview">

                    <h3>
                        📖 Overview
                    </h3>

                    <p>
                        ${
                            escapeHTML(
                                notes.overview ||
                                ""
                            )
                        }
                    </p>

                </div>


                <div class="notes-section">

                    <h3>
                        ⭐ Key Points
                    </h3>


                    <div class="notes-list">

                        ${
                            Array.isArray(
                                notes.keyPoints
                            )
                                ? notes.keyPoints
                                    .map(
                                        point => `

                                            <div
                                                class="note-point"
                                            >

                                                <span>
                                                    ✓
                                                </span>

                                                <p>
                                                    ${
                                                        escapeHTML(
                                                            point
                                                        )
                                                    }
                                                </p>

                                            </div>
                                        `
                                    )
                                    .join("")

                                : ""
                        }

                    </div>

                </div>


                <div class="notes-section">

                    <h3>
                        💡 Important Concepts
                    </h3>


                    <div class="concept-grid">

                        ${
                            Array.isArray(
                                notes.concepts
                            )
                                ? notes.concepts
                                    .map(
                                        concept => `

                                            <div
                                                class="concept-card"
                                            >

                                                <h4>
                                                    ${
                                                        escapeHTML(
                                                            concept.heading ||
                                                            ""
                                                        )
                                                    }
                                                </h4>


                                                <p>
                                                    ${
                                                        escapeHTML(
                                                            concept.explanation ||
                                                            ""
                                                        )
                                                    }
                                                </p>

                                            </div>
                                        `
                                    )
                                    .join("")

                                : ""
                        }

                    </div>

                </div>


                <div
                    class="notes-section
                           quick-revision"
                >

                    <h3>
                        ⚡ Quick Revision
                    </h3>


                    <div class="revision-list">

                        ${
                            Array.isArray(
                                notes.quickRevision
                            )
                                ? notes.quickRevision
                                    .map(
                                        point => `

                                            <div
                                                class="revision-item"
                                            >
                                                ${
                                                    escapeHTML(
                                                        point
                                                    )
                                                }
                                            </div>
                                        `
                                    )
                                    .join("")

                                : ""
                        }

                    </div>

                </div>


            </div>
        `;


    } catch (error) {

        console.error(
            "Notes generation error:",
            error
        );

        result.innerHTML = `

            <div class="loading-box">

                ❌ Notes generate nahi ho paaye.

                <br><br>

                Please dobara try karo.

            </div>
        `;
    }
}


// ============================================================
// STUDYMATE AI - SINGLE SIDEBAR NAVIGATION
// ============================================================

(function () {

    function initStudyMateTabs() {

        const buttons =
            document.querySelectorAll(
                ".sm-nav-button"
            );

        const panels =
            document.querySelectorAll(
                ".sm-panel"
            );


        if (
            !buttons.length ||
            !panels.length
        ) {
            return;
        }


        function showPanel(id) {

            panels.forEach(
                panel => {

                    panel.classList.toggle(
                        "sm-panel-active",
                        panel.id === id
                    );
                }
            );


            buttons.forEach(
                button => {

                    button.classList.toggle(
                        "sm-nav-active",
                        button.dataset.target === id
                    );
                }
            );


            localStorage.setItem(
                "studymateActivePanel",
                id
            );
        }


        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        showPanel(
                            this.dataset.target
                        );
                    }
                );
            }
        );


        const saved =
            localStorage.getItem(
                "studymateActivePanel"
            );


        const exists =
            saved &&
            document.getElementById(saved);


        showPanel(
            exists
                ? saved
                : buttons[0].dataset.target
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initStudyMateTabs
        );

    } else {

        initStudyMateTabs();
    }

})();


// ============================================================
// NOTES ACTIONS
// Copy / Regenerate / Download PDF
// ============================================================

(function () {

    function addNotesActions() {

        const result =
            document.getElementById(
                "notesResult"
            );

        if (!result) return;


        const notes =
            result.querySelector(
                ".notes-result"
            );

        if (!notes) return;


        if (
            notes.querySelector(
                ".notes-actions-final"
            )
        ) {
            return;
        }


        const actions =
            document.createElement(
                "div"
            );


        actions.className =
            "notes-actions-final";


        actions.innerHTML = `

            <button
                type="button"
                class="notes-action-final copy-final"
                onclick="copyNotesFinal()"
            >
                📋 Copy Notes
            </button>


            <button
                type="button"
                class="notes-action-final regenerate-final"
                onclick="regenerateNotesFinal()"
            >
                🔄 Regenerate
            </button>


            <button
                type="button"
                class="notes-action-final pdf-final"
                onclick="downloadNotesPDFFinal()"
            >
                📥 Download PDF
            </button>

        `;


        notes.appendChild(
            actions
        );
    }


    function notesText() {

        const result =
            document.getElementById(
                "notesResult"
            );

        if (!result) return "";

        return result.innerText
            .replace(
                /📋 Copy Notes|🔄 Regenerate|📥 Download PDF/g,
                ""
            )
            .trim();
    }


    window.copyNotesFinal =
        async function () {

            const text =
                notesText();

            if (!text) return;


            try {

                await navigator.clipboard.writeText(
                    text
                );

                alert(
                    "✅ Notes copied successfully."
                );

            } catch (error) {

                const textarea =
                    document.createElement(
                        "textarea"
                    );

                textarea.value =
                    text;

                document.body.appendChild(
                    textarea
                );

                textarea.select();

                document.execCommand(
                    "copy"
                );

                textarea.remove();

                alert(
                    "✅ Notes copied successfully."
                );
            }
        };


    window.regenerateNotesFinal =
        function () {

            const input =
                document.getElementById(
                    "notesSubject"
                );

            if (
                !input ||
                !input.value.trim()
            ) {
                return;
            }

            generateNotes();
        };


    window.downloadNotesPDFFinal =
        function () {

            const text =
                notesText();

            if (!text) return;


            if (
                !window.jspdf ||
                !window.jspdf.jsPDF
            ) {

                alert(
                    "⚠️ PDF library load nahi hui. Page refresh karke dobara try karo."
                );

                return;
            }


            const {
                jsPDF
            } =
                window.jspdf;


            const doc =
                new jsPDF();


            const margin = 15;


            const pageWidth =
                doc.internal.pageSize.getWidth();


            const usableWidth =
                pageWidth -
                margin * 2;


            const lines =
                doc.splitTextToSize(
                    text,
                    usableWidth
                );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.setFontSize(
                11
            );


            let y = 18;


            lines.forEach(
                line => {

                    if (y > 280) {

                        doc.addPage();

                        y = 18;
                    }


                    doc.text(
                        line,
                        margin,
                        y
                    );


                    y += 6;
                }
            );


            const input =
                document.getElementById(
                    "notesSubject"
                );


            const filename =
                (
                    input?.value.trim() ||
                    "studymate-notes"
                )
                    .replace(
                        /[^a-z0-9\-_ ]/gi,
                        ""
                    )
                    .trim()
                    .replace(
                        /\s+/g,
                        "_"
                    ) ||
                "studymate-notes";


            doc.save(
                filename +
                ".pdf"
            );
        };


    function observeNotes() {

        const result =
            document.getElementById(
                "notesResult"
            );

        if (!result) return;


        const observer =
            new MutationObserver(
                addNotesActions
            );


        observer.observe(
            result,
            {
                childList: true,
                subtree: true
            }
        );


        addNotesActions();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            observeNotes
        );

    } else {

        observeNotes();
    }

})();