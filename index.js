const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();
const app = express();
const port = process.env.PORT;
const uri = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB client and collection
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


async function run() {
  try {
    await client.connect();
    const db = client.db("mediqueue");
    const tutorsCollection = db.collection("tutors");
    console.log("Successfully Connected to MongoDB: mediqueue");

    app.get("/tutors", async (req, res) => {
      const tutors = await tutorsCollection.find().toArray();
      console.log(tutors);
      res.send(tutors);
    });

    app.get("/tutors/:id", async (req, res) => {
      const { id } = req.params;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await tutorsCollection.findOne(query);
      res.send(result);
    });

    app.post('/booking-sessions', async (req, res) => {
      const bookingData = req.body;
      const result = await db.collection('booking-sessions').insertOne(bookingData);
      res.send(result);
    });

  } finally {
    // await client.close();
  }
}

run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Server is running for tutors!");
});

app.listen(port, () => {
  console.log(`Server running on ${port} port`);
});
