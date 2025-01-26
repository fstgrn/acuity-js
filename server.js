const express = require("express");
const Acuity = require("./src/AcuityScheduling"); // acuity-js library
require("dotenv").config(); // Load environment variables

const app = express();
app.use(express.json()); // Middleware to parse JSON

// Acuity API configuration
const acuity = new Acuity({
  userId: process.env.ACUITY_USER_ID, // Acuity user ID
  apiKey: process.env.ACUITY_API_KEY, // Acuity API key
});

// Endpoint: Fetch Services (includes prices)
app.get("/services", async (req, res) => {
  try {
    acuity.request("/appointment-types", (err, _, appointmentTypes) => {
      if (err) {
        console.error("Error fetching services from Acuity:", err);
        return res.status(500).json({ error: "Failed to load services" });
      }

      // Map the appointment types to include only relevant data
      const services = appointmentTypes.map((type) => ({
        id: type.id,
        name: type.name,
        description: type.description,
        price: type.price, // Assuming Acuity provides a `price` field
      }));

      console.log("Services fetched successfully:", services);
      res.json(services);
    });
  } catch (error) {
    console.error("Unexpected error in /services endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});