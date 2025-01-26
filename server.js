const express = require("express");
const Acuity = require("./src/AcuityScheduling"); // acuity-js library
require("dotenv").config(); // Load environment variables from .env

const app = express();
app.use(express.json()); // Middleware to parse JSON

// CORS Middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Acuity API configuration
const acuity = new Acuity({
  userId: process.env.ACUITY_USER_ID, // Acuity user ID from environment variables
  apiKey: process.env.ACUITY_API_KEY, // Acuity API key from environment variables
});

// Endpoint: Fetch Services
app.get("/services", (req, res) => {
  acuity.request("/appointment-types", (err, _, appointmentTypes) => {
    if (err) {
      console.error("Error fetching services from Acuity:", err);
      return res.status(500).json({ error: "Failed to load services" });
    }
    if (!appointmentTypes || appointmentTypes.length === 0) {
      return res.status(404).json({ error: "No services found" });
    }
    const services = appointmentTypes.map((type) => ({
      id: type.id,
      name: type.name,
      description: type.description,
      price: type.price,
    }));
    res.json(services);
  });
});

// Endpoint: Book Appointment
app.post("/book", (req, res) => {
  const { firstName, lastName, email, datetime, appointmentTypeID } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !datetime || !appointmentTypeID) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Create appointment on Acuity
  acuity.request(
    {
      method: "POST",
      path: "/appointments",
      body: {
        firstName,
        lastName,
        email,
        datetime,
        appointmentTypeID,
      },
    },
    (err, _, appointment) => {
      if (err) {
        console.error("Error creating appointment:", err);
        return res.status(500).json({ error: "Failed to create appointment" });
      }
      res.json(appointment);
    }
  );
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});