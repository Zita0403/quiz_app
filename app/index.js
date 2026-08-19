// Built-in Node.js modules
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

let totalScore = 0;
let askedQuestions = [];

async function getRandomQuestion() {
  const result = await db.query(
    `WITH random_question AS (
        SELECT id, question_text
        FROM questions
        WHERE NOT (id = ANY($1))
        ORDER BY RANDOM()
        LIMIT 1
    )
    SELECT 
        rq.id AS question_id,
        rq.question_text,
        a.id AS answer_id,
        a.answer_text
    FROM random_question rq
    JOIN question_answers qa ON rq.id = qa.question_id
    JOIN answers a ON a.id = qa.answer_id
    ORDER BY RANDOM();`,
    [askedQuestions]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const question = {
    id: result.rows[0].question_id,
    text: result.rows[0].question_text
  };

  const answers = result.rows.map(row => ({
    id: row.answer_id,
    text: row.answer_text
  }));

  askedQuestions.push(question.id);
  return { question, answers };
}

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/start", async (req, res) => {
  totalScore = 0;
  askedQuestions = [];
  const firstQuestion = await getRandomQuestion();

  if (!firstQuestion) {
    return res.send("Nincsenek elérhető kérdések.");
  }

  const { question, answers } = firstQuestion;
  res.render("quiz.ejs", { question, answers, totalScore });
});

app.post("/next", async (req, res) => {
  const { answerId } = req.body; 
  
  if (!answerId) return res.status(400).json({ error: "Missing answerId" });

  const check = await db.query(
    "SELECT is_correct FROM question_answers WHERE answer_id = $1",
    [answerId]
  );

  if (check.rows[0]?.is_correct) totalScore++;

  const nextQuestion = await getRandomQuestion();

  if (!nextQuestion) {
    return res.json({ finished: true, totalScore });
  }

  const { question, answers } = nextQuestion;
  res.json({ question, answers, totalScore });
});

app.get("/results", (req, res) => {
  res.render("results.ejs", {totalScore});
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});