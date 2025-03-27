import Stripe from "stripe";
import { MongoClient, ObjectId } from "mongodb";

import { config } from "dotenv";

config();

const stripe = new Stripe(process.env.StripeAPI);
const client = new MongoClient(process.env.MONGODB_URI);

export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
  }
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
          employerUserId: new ObjectId(employerUserId)
        }
      },
      {
        $lookup: {
          from: "stripe_customer",
          localField: "stripeCustomerId",
          foreignField: "_id",
          as: "stripeCustomer"
        }
      }
    ]);
  } catch (error) {
    if (error.name == "BSONError") {
      response.statusCode = 400;
      response.body = JSON.stringify({ message: error.message });
      return response
    }
    response.statusCode = 500;
    response.body = JSON.stringify({ message: error.message });
    return response
  }
  console.timeLog("aggregate");

  const user = await aggregate.next();
  if (!user) {
    response.statusCode = 404;
    response.body = JSON.stringify({ message: "User not found" });
    return response
  }
  const card = await stripe.customers.listPaymentMethods(
    user.stripeCustomer[0].customerId,
    { type: 'card' },
  )
  const invoice = await stripe.invoices.list(
    {
      customer: user.stripeCustomer[0].customerId
    }
  )
  response.body = JSON.stringify({
    card: card.data[0].card?.brand,
    exp_month: card.data[0].card?.exp_month,
    exp_year: card.data[0].card?.exp_year,
    last4: card.data[0].card?.last4,
    invoice_id: invoice.data[0].number,
    invoice_pdf: invoice.data[0].invoice_pdf,
    paid_at: invoice.data[0].status_transitions.paid_at,
    payment_status: invoice.data[0].status
  });
  console.timeEnd("aggregate");
  return response
}

const event = {
  pathParameters: {
    employerUserId: "65d97406acc39b0e45ffd358"
  }
}

console.log(await handler(event));
process.exit(0)