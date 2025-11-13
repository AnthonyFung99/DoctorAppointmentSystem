const dotenv = require('dotenv');
dotenv.config();

const { Document } = require('langchain/document');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');

const embeddingsModel = new GoogleGenerativeAIEmbeddings({
      model: 'text-embedding-004',  
      apiKey: process.env.GEMINI_API_KEY,
     });
    

// Project Description
const projectDescription = `
An Application Programming Interface (API) allows different software systems to communicate with one another without needing to understand each other's internal structure. APIs are essential for building scalable, modular applications where various components—such as the frontend and backend—interact seamlessly.

In this project, we will design and build a robust, secure, and scalable REST API for a doctor appointment booking application. The backend will be developed using Node.js and Express.js, and MongoDB will serve as the primary data store. This API will act as the bridge between client-side applications—such as web frontends or mobile interfaces—and the database, handling all essential operations like doctor registration, patient authentication, appointment management, and review collection.

The platform provides support for patient registration and login using email, password, and basic profile details such as full name and date of birth. Once authenticated, patients can view a comprehensive list of doctors, search them by specialty, check their availability, and book appointments within open time slots. Patients also have the ability to cancel bookings and submit detailed reviews about their experiences, including a rating and a short comment. Every review is tied to a patient and a doctor, ensuring authenticity and traceability.

The database contains records for 50 patients and 50 doctors. Each doctor profile includes a name, email, secure password, professional bio, profile image, years of experience, and a breakdown of consultation fees for both in-person and virtual visits. Doctors are each affiliated with a unique clinic, which includes the clinic’s name and fee structure. Examples of these include institutions like “City General Hospital” and “Heartbeat Cardiology,” with fees ranging from approximately 1200 to 3500 PKR.

Doctors are assigned one or more specialties out of a total pool of 50 medical fields. These include common areas such as Cardiology, Dermatology, and Psychiatry, as well as more specialized disciplines like Pediatric Neurology, Bariatric Surgery, and Sleep Medicine. This specialty system supports dynamic filtering, so patients can search for doctors based on their exact needs. Additionally, each doctor manages their availability by creating appointment slots, which specify date, start and end times, and a booking status flag. The system records whether each slot has been booked, supporting real-time availability updates.

Security is enforced using modern authentication mechanisms. JSON Web Tokens (JWT) are used to securely manage authenticated sessions for both patients and doctors. Passwords are stored securely using the bcrypt hashing algorithm, preventing plain-text exposure and enhancing user safety. Only authenticated users are allowed to interact with sensitive endpoints, such as booking appointments or leaving reviews.

The REST API follows standard RESTful conventions with clearly defined routes and HTTP methods. These include endpoints for registering and logging in patients or doctors, fetching available doctors by specialty or date, managing appointments, retrieving clinic information, and submitting reviews. Routes are designed to be resource-based and scalable, following best practices for modular backend development.

Technologies used in the project include Node.js as the server-side runtime, Express.js for building and structuring HTTP routes, and MongoDB as the NoSQL database. Mongoose is used for schema modeling and simplifying data interaction. JWT handles session management, while bcrypt ensures secure password storage. Docker is integrated for containerized deployment, allowing consistent environments across development and production stages.

The backend is organized into a modular architecture with distinct folders for controllers, models, routes, and middleware. This structure enhances maintainability and scalability. The system can be extended with additional features such as email notifications, appointment reminders, payment integrations, multi-language support, or real-time chat with doctors. Overall, this API provides a comprehensive foundation for an intelligent, user-friendly healthcare platform designed to streamline doctor-patient interactions and modernize appointment scheduling workflows.
`;


let vectorStore = null;

// Replace the initializeVectorStore function with your implementation
async function initializeVectorStore() {
  console.log(' Initializing vector store from project description...');
  try {
    // Create Document from project description
    const document = new Document({
      pageContent: projectDescription,
      metadata: { source: "project_description" },
    });

    // Split the document into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.splitDocuments([document]);

    console.log(`Split into ${docs.length} document chunks.`);

    // Embed the documents
    vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddingsModel);

    console.log('Vector store initialized and ready.');
  } catch (err) {
    console.error(' Error initializing vector store:', err.message);
    process.exit(1);
  }
}


module.exports = {
  initializeVectorStore,
  getVectorStore: () => vectorStore,
};