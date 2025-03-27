import Stripe from "stripe";
import { config } from "dotenv";

config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const link = await stripe.paymentLinks.create({
  line_items: [
    {
      price: "price_1OmBr9SEFUwbQhR8TrJEphOa",
      quantity: 1,
    },
  ],
  after_completion: {
    type: "redirect",
    redirect: {
      url: "https://example.com",
    },
  },
});

console.log(link.url);
// const paymentIntent = await stripe.paymentIntents.create({
//   amount: 2000,
//   currency: "usd",
//   automatic_payment_methods: {
//     enabled: true,
//   },
// });

const account = await stripe.accounts.create({
  type: "standard",
});

const accountLink = await stripe.accountLinks.create({
  account: `${account.id}`,
  refresh_url: "https://example.com/reauth",
  return_url: "https://example.com/return",
  type: "account_onboarding",
});

console.log(accountLink);
