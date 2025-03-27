import Stripe from "stripe";
import { MongoClient, ObjectId } from "mongodb";

import { config } from "dotenv";

config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = new MongoClient(process.env.MONGODB_URI);

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
  };
  const pathParams = event.pathParameters;
  const employerUserId = pathParams.employerUserId;

  const db = client.db("dashboard");
  const SubData = db.collection("subscription_data");
  let aggregate;
  console.time("aggregate");
  try {
    aggregate = SubData.aggregate([
      {
        $match: {
          employerUserId: new ObjectId(employerUserId),
        },
      },
      {
        $lookup: {
          from: "stripe_customer",
          localField: "stripeCustomerId",
          foreignField: "_id",
          as: "stripeCustomer",
        },
      },
      { $unbwind: "$stripeCustomer" },
    ]);
  } catch (error) {
    if (error.name == "BSONError") {
      response.statusCode = 400;
      response.body = JSON.stringify({ message: error.message });
      return response;
    }
    response.statusCode = 500;
    response.body = JSON.stringify({ message: error.message });
    return response;
  }
  console.timeLog("aggregate");

  const user = await aggregate.next();
  if (!user) {
    response.statusCode = 404;
    response.body = JSON.stringify({ message: "User not found" });
    return response;
  }
  const url = await stripe.billingPortal.sessions.create({
    configuration: "bpc_1ON6xXSEFUwbQhR85GTnPQPP",
    customer: user.stripe_data[0].customerId,
    return_url: "http://localhost:4200/employer/subscription",
  });
  response.body = JSON.stringify(url);
  console.timeEnd("aggregate");
  return response;
};

const event = {
  pathParameters: {
    employerUserId: "65d97406acc39b0e45ffd358",
  },
};

console.log(await handler(event));
process.exit(0);
