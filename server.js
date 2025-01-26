const express = require("express");
const Acuity = require("./src/AcuityScheduling"); // acuity-js library
require("dotenv").config(); // Load environment variables from .env

const app = express();
app.use(express.json()); // Middleware to parse JSON

// Acuity API configuration
const acuity = new Acuity({
  userId: process.env.ACUITY_USER_ID, // Acuity user ID from .env
  apiKey: process.env.ACUITY_API_KEY, // Acuity API key from .env
});

// Endpoint: Fetch Availability
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

// Endpoint: Create Appointment
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});