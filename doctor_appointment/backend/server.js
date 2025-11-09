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

// ===================== Add Task 7 code here ===================== 


// ===================== Add Task 8 code here ===================== 


// ===================== Add Task 10 code here ===================== 


// ===================== Add Task 11 code here ===================== 


// ===================== Add Task 12 code here ===================== 


// === Task 5: Establish the database connection and error handling here === 

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL");
});


// ===================== Task 5: Start the Server here ===================== 
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});