require('dotenv').config();
console.log(`Server Code Here`);

// ===== Import Required Packages ===== 
const express = require("express");           // Web framework for Node.js
const cors = require("cors");                 // Middleware to enable CORS
const mysql = require("mysql2");              // MySQL client
const bodyParser = require("body-parser");    // Middleware to parse JSON bodies

const app = express();
const port = 3000;

// ===== Middleware Setup ===== 
app.use(cors());
app.use(bodyParser.json());

// ===== MySQL Database Connection ===== 
const db = mysql.createConnection({
  host: "localhost",
  user: "educative",
  password: "Educative@123",
  database: "doctor_appointment"
});

 // ===================== Get All Doctors Route ===================== 

app.get("/doctors", (req, res) => {
  // Get pagination and search parameters from query string
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search ? `%${req.query.search.toLowerCase()}%` : null;
  const offset = (page - 1) * limit;

  // Base SQL query to fetch doctors with joined specialties
  let baseSql = `
    SELECT 
      d.id, 
      d.name, 
      d.email, 
      d.bio, 
      d.image_url, 
      d.exp, 
      d.total_patients,
      d.online_fee, 
      d.visit_fee, 
      GROUP_CONCAT(s.name SEPARATOR ', ') AS specialties
    FROM doctors d
    JOIN doctor_specialties ds ON d.id = ds.doctor_id
    JOIN specialties s ON ds.specialty_id = s.id
  `;

  // Array to hold conditional clauses and values
  const conditions = [];
  const values = [];

  // If search query exists, filter by doctor name or specialty
  if (search) {
    conditions.push("(LOWER(d.name) LIKE ? OR LOWER(s.name) LIKE ?)");
    values.push(search, search);
  }

  // Add WHERE clause if conditions exist
  if (conditions.length) {
    baseSql += " WHERE " + conditions.join(" AND ");
  }

  // Add GROUP BY, LIMIT, and OFFSET clauses for pagination
  baseSql += " GROUP BY d.id LIMIT ? OFFSET ?";
  values.push(limit, offset);

  // Execute the query
  db.query(baseSql, values, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ===================== Get Single Doctor by ID ===================== 

app.get("/doctors/:id", (req, res) => {
  const doctorId = req.params.id; // Extract doctor ID from URL parameters

  // SQL query to fetch detailed doctor information
  const sql = `
    SELECT 
      d.id,
      d.name,
      d.email,
      d.bio,
      d.image_url,
      d.exp,
      d.total_patients,
      d.online_fee,
      d.visit_fee,

      -- Fetch specialties as a comma-separated string
      GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') AS specialties,

      -- Fetch associated clinic details as a JSON array
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'clinic_name', dc.clinic_name,
            'clinic_fee', dc.clinic_fee
          )
        )
        FROM doctor_clinic dc
        WHERE dc.doctor_id = d.id
      ) AS clinics,

      -- Fetch recent reviews with patient name and rating
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'rating', r.rating,
            'comment', r.comment,
            'patient_name', p.name,
            'daysAgo', DATEDIFF(CURDATE(), r.id)
          )
        )
        FROM reviews r
        JOIN patients p ON r.patient_id = p.id
        WHERE r.doctor_id = d.id
        ORDER BY r.id DESC
        LIMIT 5
      ) AS reviews,

      -- Fetch upcoming availability records
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'available_date', a.available_date,
            'start_time', a.start_time,
            'end_time', a.end_time
          )
        )
        FROM availability a
        WHERE a.doctor_id = d.id AND a.available_date >= CURDATE()
        ORDER BY a.available_date ASC
        LIMIT 5
      ) AS availability

    FROM doctors d
    LEFT JOIN doctor_specialties ds ON d.id = ds.doctor_id
    LEFT JOIN specialties s ON ds.specialty_id = s.id
    WHERE d.id = ?
    GROUP BY d.id;
  `;

  // Execute the query
  db.query(sql, [doctorId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message }); // Server/database error
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Doctor not found" }); // No doctor with this ID
    }

    // Send the result (doctor details) as JSON response
    res.json(results[0]);
  });
}); 


// ===================== User Signup ===================== 
app.post("/signup", (req, res) => {
  const { username, password, dob, email } = req.body;

  const sql = `
    INSERT INTO patients (name, email, password, dob)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [username, email, password, dob], (err, result) => {
    if (err) {
      // Handle database errors like duplicate email or connection issue
      return res.status(500).json({ error: err.message });
    }

    // Respond with success message if insertion succeeds
    res.status(201).json({ message: "User registered successfully" });
  });
});

// ===================== User Login ===================== 
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // SQL query to find user by email and password
  const sql = `
    SELECT id FROM patients
    WHERE email = ? AND password = ?
  `;

  db.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    // Check if exactly one matching user is found
    if (results.length === 1) {
      res.json({ success: true, userId: results[0].id });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });
});

// ===================== Appointment Routes ===================== 

/**
 *  GET /appointments/user/:userId
 * Fetch all appointments for a specific user
 * - Accepts user ID as a route parameter
 * - Joins appointments with doctor details to return the doctor’s name
 * - Orders results by most recent appointment date and time
 */
 app.get("/appointments/user/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT 
      a.id, 
      a.appointment_date, 
      a.time_slot, 
      a.reason, 
      d.name AS doctor_name
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_date DESC, a.time_slot ASC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/**
 * DELETE /appointments/:id
 * Delete a specific appointment by its ID
 * - Accepts appointment ID as a route parameter
 * - Executes a DELETE SQL query.
 */
app.delete("/appointments/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM appointments WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Appointment deleted successfully" });
  });
});

/**
 * POST /book-appointment
 * Book a new appointment.
 * - Extracts `patientId`, `doctorId`, `date`, `time`, and `reason` from `req.body`
 * - Inserts new appointment into the `appointments` table
 */
app.post("/book-appointment", (req, res) => {
  const { patientId, doctorId, date, time, reason } = req.body;

  // Basic validation
  if (!patientId || !doctorId || !date || !time || !reason) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const query = `
    INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, reason)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [patientId, doctorId, date, time, reason], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(200).json({ 
      message: "Appointment booked successfully", 
      appointmentId: result.insertId 
    });
  });
});


// ===  Establish the database connection and error handling here === 

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

// LangChain imports

const {ChatGoogleGenerativeAI} = require('@langchain/google-genai');

// Initialize Chat model
const chatModel = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  apiKey:process.env.GEMINI_API_KEY,
  temperature: 0
});

const {
  initializeVectorStore,
  getVectorStore
} = require('./chatbot-service'); // Adjust path if needed

const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  console.log("chat bot");

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Please enter a valid message about the project.' });
  }

  const trimmedMessage = message.trim();
  const lowerMessage = trimmedMessage.toLowerCase();

  const greetingRegex = /^(hi|hello|hey|greetings|how are you|what's up)\b/i;
  if (greetingRegex.test(lowerMessage)) {
    return res.json({
      reply: `Hi, I'm your API assistant. Feel free to ask me anything about the doctor appointment project!`,
      context: [],
      source: "greeting"
    });
  }

  const vectorStore = getVectorStore();
  if (!vectorStore) {
    return res.status(503).json({ error: 'Project data is still loading. Please try again shortly.' });
  }

  try {
    console.log(`📩 User question: "${message}"`);
    const relevantDocs = await vectorStore.similaritySearch(trimmedMessage, 5);

    if (relevantDocs.length === 0) {
      return res.json({
        reply: "I couldn't find any relevant information in the project description for your question. Please ask something else.",
        context: []
      });
    }

    const projectContext = relevantDocs.map(doc => doc.pageContent).join('\n---\n');

    const strictPrompt = ChatPromptTemplate.fromPromptMessages([
      { role: "system", content: `
          You are an AI assistant for a doctor appointment API. Use ONLY the project data below to answer.

          Rules:
          - Only answer using the info in "Project Data".
          - If data doesn't cover the question, say: "I don't have that information in the project description. Please ask something else."
          - No guessing or hallucinating.

          Project Data:
          {projectContext}
      ` },
      { role: "user", content: "{question}" }
    ]);

    const messages = await strictPrompt.formatMessages({
      projectContext,
      question: trimmedMessage
    });

    const aiResponse = await chatModel.call(messages);

    console.log('Response:', aiResponse);

    res.json({
      reply: aiResponse.text || aiResponse,
      context: relevantDocs.map(doc => doc.pageContent)
    });

  } catch (error) {
    console.error('Error processing question:', error.message);
    res.status(500).json({
      error: 'Error processing your question',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Start the server only after vector store is ready
async function startServer() {
  await initializeVectorStore();  // Load and embed project description
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('Vector store ready for project description');
  });
}

// Kick off the async initialization + server start process
startServer();

// Export the app instance for use in tests or other modules
module.exports = app;

// =====================  Start the Server here ===================== 
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});