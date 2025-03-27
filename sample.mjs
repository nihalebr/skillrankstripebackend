import Stripe from "stripe";
import { MongoClient, ObjectId } from "mongodb";

const stripe = new Stripe(process.env.StripeAPI);
const client = new MongoClient(process.env.MONGODB_URI);

export const handler = async (event) => {
    const queryParams = event.queryStringParameters;
    const employerUserId = queryParams.employerUserId;

    const db = client.db("dashboard");
    const SubData = db.collection("subscription_data");
    console.time("aggregate");
    const aggregate = SubData.aggregate([
        {
            $match: {
                employerUserId: new ObjectId(employerUserId)
            }
        },
        {
            $lookup: {
                from: "plan_data",
                localField: "planId",
                foreignField: "_id",
                as: "plan_data"
            }
        }
    ])
    const data = await aggregate.toArray();
    console.dir(data, { depth: null });
    console.timeLog("aggregate");
    return;
}



const event = {
    queryStringParameters: {
        employerUserId: "65d97406acc39b0e45ffd358"
    }
}

await handler(event)
console.timeEnd("aggregate");
process.exit(0)