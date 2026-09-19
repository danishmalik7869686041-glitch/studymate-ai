const express = require("express");
const cors = require("cors");
require("dotenv").config();

const multer = require("multer");

// PDF-PARSE v2
const { PDFParse } = require("pdf-parse");

const { GoogleGenAI } = require("@google/genai");

const app = express();


// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


// ===============================
// FILE UPLOAD
// ===============================

const upload = multer({
    storage: multer.memoryStorage()
});


// ===============================
// GEMINI AI
// ===============================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ===============================
// ASK AI
// ===============================

app.post("/ask", async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                error: "Question enter karo."
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `You are StudyMate AI, a helpful student study assistant.

Answer the student's question clearly and simply.

Student Question:
${question}`
        });

        res.json({
            answer: response.text
        });

    } catch (error) {
        console.error("ASK AI ERROR:", error);

        res.status(500).json({
            error: "AI response nahi aa raha."
        });
    }
});


// ===============================
// PDF UPLOAD + AI SUMMARY
// ===============================

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {

    let parser = null;

    try {

        // Check PDF
        if (!req.file) {
            return res.status(400).json({
                error: "PDF file upload karo."
            });
        }


        // ===============================
        // PDF TEXT EXTRACTION
        // ===============================

        parser = new PDFParse({
            data: req.file.buffer
        });

        const pdfData = await parser.getText();

        const text = pdfData.text || "";


        // Check extracted text
        if (!text.trim()) {
            return res.status(400).json({
                error: "PDF me readable text nahi mila."
            });
        }


        console.log("PDF text extracted successfully.");

        console.log(
            "Extracted characters:",
            text.length
        );


        // ===============================
        // AI SUMMARY
        // ===============================

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `You are StudyMate AI.

Read the following study notes extracted from a PDF and create a simple student-friendly summary.

Include:

- Main topics
- Important points
- Key definitions
- Important facts
- Easy explanation

Keep the summary clear, short and easy for a student to understand.

Do not add unnecessary information that is not present in the PDF.

PDF NOTES:

${text}`
        });


        // ===============================
        // SEND SUMMARY TO FRONTEND
        // ===============================

        res.json({
            summary: response.text
        });

    } catch (error) {

        console.error("PDF ERROR:", error);

        res.status(500).json({
            error: "PDF process nahi ho pa raha."
        });

    } finally {

        // Clean PDF parser resources
        if (parser) {
            try {
                await parser.destroy();
            } catch (destroyError) {
                console.error(
                    "PDF DESTROY ERROR:",
                    destroyError
                );
            }
        }
    }
});


// ===============================
// CREATE STUDY PLAN
// ===============================

app.post("/create-plan", async (req, res) => {
    try {

        const { subject, days } = req.body;

        if (!subject || !days) {
            return res.status(400).json({
                error: "Subject aur days enter karo."
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `Create a simple ${days}-day study plan for ${subject}.

For each day include:

- Topic to study
- Practice/revision
- Daily goal

Keep it simple and easy to follow.

Make the plan student-friendly.`
        });

        res.json({
            plan: response.text
        });

    } catch (error) {

        console.error("STUDY PLAN ERROR:", error);

        res.status(500).json({
            error: "Study plan nahi ban paya."
        });
    }
});


// ===============================
// GENERATE QUIZ
// ===============================

app.post("/generate-quiz", async (req, res) => {
    try {

        const { subject, questions } = req.body;

        if (!subject || !questions) {
            return res.status(400).json({
                error: "Subject aur questions enter karo."
            });
        }


        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `Create a ${questions}-question multiple-choice quiz for a student studying ${subject}.

Return ONLY valid JSON in this exact format:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": 0
    }
  ]
}

Rules:

- Create exactly ${questions} questions.
- Each question must have exactly 4 options.
- "answer" must be the number 0, 1, 2, or 3.
- 0 means Option A.
- 1 means Option B.
- 2 means Option C.
- 3 means Option D.
- Do NOT include the correct answer as text outside the JSON.
- Do NOT use markdown.
- Do NOT use code fences.
- Keep questions clear and educational.
- Return ONLY JSON.`
        });


        res.json({
            quiz: response.text
        });

    } catch (error) {

        console.error("QUIZ ERROR:", error);

        res.status(500).json({
            error: "Quiz nahi ban paya."
        });
    }
});


// ===============================
// START SERVER
// ===============================

app.listen(3000, () => {
    console.log(
        "StudyMate AI running at http://localhost:3000"
    );
});