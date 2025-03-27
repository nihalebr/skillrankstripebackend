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
    for (const record of event.Records) {
      const employerUserId = record.body.employerUserId;
      const usage = record.body.usage;

      const user = await User.findOne({
        employerUserId: employerUserId,
      });
      const customerId = user.customerId;
      const subscription = await stripe.subscriptions.list({
        customer: customerId,
      });
      console.log(subscription.data);
    }
    return "Success";
  } catch (error) {
    console.error(`Error processing : ${error.message}`);
    throw new Error("Error updating the usage information.");
  }
};

var event = {
  Records: [
    {
      body: {
        employerUserId: "12345",
        usage: 1,
      },
    },
  ],
};

console.log(handler(event));
