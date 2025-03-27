import Stripe from "stripe";
import { config } from "dotenv";

config();

console.log(process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handler = async (event) => {
  try {
    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1ONYedSEFUwbQhR8n6fcEIp8",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/cancel`,
      metadata: {
        productId: "prod_PBwXXjTIOIzupJ",
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: session.url,
      }),
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error creating checkout session",
      }),
    };
  }
};

console.log(await handler({}));
