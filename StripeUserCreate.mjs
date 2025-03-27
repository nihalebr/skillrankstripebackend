import Stripe from "stripe";
import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = new MongoClient(process.env.MONGODB_URI);

export const handler = async (event, context) => {
  const db = client.db("dashboard");
  const User = db.collection("stripe");

  try {
    // Process each SQS message
    for (const record of event.Records) {
      const customerEmail = record.body.email;
      const customerName = record.body.name;
      const employerUserId = record.body.employerUserId;

      const customer = await stripe.customers.create({
        name: customerName,
        email: customerEmail,
      });

      const user = await User.insertOne({
        employerUserId: employerUserId,
        customerId: customer.id,
        timestamp: new Date().toISOString(),
      }).catch((error) => {
        console.error(`Error processing SQS message: ${error.message}`);
        throw new Error("Error adding user to database.");
      });

      console.log(
        `User ${customerEmail} added to Stripe as customer: ${customer.id} and added to database with id ${user.insertedId}`
      );
    }

    return "User(s) added to Stripe successfully.";
  } catch (error) {
    // Handle errors (logging, retries, etc.)
    console.error(`Error processing SQS message: ${error.message}`);
    throw new Error("Error adding user to Stripe.");
  }
};

var event = {
  Records: [
    {
      body: {
        email: "Xb9Ht@example.com",
        name: "John Doe",
        employerUserId: "12345",
      },
    },
  ],
};

console.log(handler(event));
