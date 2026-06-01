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
      res.json(tutors);
    });

    app.post("/tutors", async (req, res) => {
      const tutorData = req.body;
      const result = await db
        .collection("tutors")
        .insertOne(tutorData);
      res.json(result);
    });

    app.get("/tutors/:id", async (req, res) => {
      const { id } = req.params;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await tutorsCollection.findOne(query);
      res.json(result);
    });

    app.get("/tutors/:userId", async (req, res) => {
      const {userId} = req.params;
      const query = {
        userId: userId,
      };
      const tutors = await tutorsCollection.find(query).toArray();
      console.log(tutors);
      res.json(tutors);
    });

    app.post('/booked-sessions', async (req, res) => {
      const bookingData = req.body;
      const result = await db.collection('booked-sessions').insertOne(bookingData);
      res.json(result);
    });

    app.get("/booked-sessions", async (req, res) => {
      const bookedSessions = await db.collection('booked-sessions').find().toArray();
      console.log(bookedSessions);
      res.json(bookedSessions);
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
