const express = require("express");
const Acuity = require("./src/AcuityScheduling"); // acuity-js library
require("dotenv").config(); // Load environment variables from .env

const app = express();
app.use(express.json()); // Middleware to parse JSON

// Acuity API configuration
const acuity = new Acuity({
  userId: process.env.ACUITY_USER_ID, // Acuity user ID from environment
  apiKey: process.env.ACUITY_API_KEY, // Acuity API key from environment
});

// Endpoint: Fetch Services (appointment types)
app.get("/services", (req, res) => {
  acuity.request("/appointment-types", (err, _, services) => {
    if (err) {
      console.error("Error fetching services:", err);
      return res.status(500).json({ error: "Failed to fetch services" });
    }
    res.json(services);
  });
});

// Endpoint: Fetch Availability for a service
app.get("/availability", (req, res) => {
  const { appointmentTypeID, date } = req.query;

  if (!appointmentTypeID || !date) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  acuity.request(
    `/availability/times?appointmentTypeID=${appointmentTypeID}&date=${date}`,
    (err, _, availability) => {
      if (err) {
        console.error("Error fetching availability:", err);
        return res.status(500).json({ error: "Failed to fetch availability" });
      }
      res.json(availability);
    }
  );
});

// Endpoint: Create Appointment (book a service)
app.post("/book", (req, res) => {
  const { firstName, lastName, email, datetime, appointmentTypeID } = req.body;

  if (!firstName || !lastName || !email || !datetime || !appointmentTypeID) {
    return res.status(400).json({ error: "Missing required fields" });
  }

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

// Test endpoint to verify the server is running
app.get("/", (req, res) => {
  res.send("Acuity Scheduling API Server is running!");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});