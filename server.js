const express = require("express");
const Acuity = require("./src/AcuityScheduling"); // acuity-js library
const axios = require("axios"); // For Shopify API requests
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

// Endpoint: Create Appointment and Sync with Shopify
app.post("/book", async (req, res) => {
  const { firstName, lastName, email, datetime, appointmentTypeID, serviceType } = req.body;

  if (!firstName || !lastName || !email || !datetime || !appointmentTypeID) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Step 1: Create the appointment in Acuity
    const acuityResponse = await new Promise((resolve, reject) => {
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
          if (err) reject(err);
          else resolve(appointment);
        }
      );
    });

    console.log("Appointment created in Acuity:", acuityResponse);

    // Step 2: Sync the booking with Shopify cart
    const shopifyCartResponse = await axios.post(
      "https://skyngroup.myshopify.com/cart/add.js",
      {
        items: [
          {
            id: "9453377356041", // Shopify Product Variant ID
            quantity: 1,
            properties: {
              "Appointment Date": datetime,
              "Service Type": serviceType,
              "Client Name": `${firstName} ${lastName}`,
            },
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Booking synced with Shopify cart:", shopifyCartResponse.data);

    // Respond with both Acuity and Shopify data
    res.status(201).json({
      message: "Appointment successfully created and synced with Shopify.",
      acuity: acuityResponse,
      shopify: shopifyCartResponse.data,
    });
  } catch (error) {
    console.error("Error creating appointment or syncing with Shopify:", error);
    res.status(500).json({ error: "Failed to create appointment or sync with Shopify." });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});