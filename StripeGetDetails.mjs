import Stripe from "stripe";
import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = new MongoClient(process.env.MONGODB_URI);

export const handler = async (event) => {
  const db = client.db("dashboard");
  const User = db.collection("stripe");
  const { customerId } = event.body;
  const user = await User.findOne({ customerId: customerId });

  const users = await stripe.customers.listPaymentMethods(customerId, {
    type: "card",
  });
  const subscription = await stripe.subscriptions.list({
    customer: customerId,
  });
  const invoice = await stripe.invoices.list({
    customer: customerId,
  });
  console.log(subscription.data[0], users.data[0], invoice.data);
};

await handler({
  body: {
    customerId: "cus_PLOjqP4znU7Rb9",
  },
});

process.exit(0);
