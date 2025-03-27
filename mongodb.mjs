import { MongoClient, ObjectId } from "mongodb";
import { config } from "dotenv";

config();

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
          from: "plan_data",
          localField: "planId",
          foreignField: "_id",
          as: "plan"
        }
      },
      { $unwind: '$plan' },
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
  const data = await aggregate.next();
  if (!data) {
    response.statusCode = 404;
    response.body = JSON.stringify({ message: "No data found" });
    return response
  }
  response.body = JSON.stringify(data);
  return response;
};



const event = {
  pathParameters: {
    employerUserId: "65d97406acc39b0e45ffd358"
  }
}

console.log(await handler(event));
console.timeEnd("aggregate");
process.exit(0)