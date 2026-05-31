const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");
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
    console.log("Successfully Connected to MongoDB:");

    app.get("/tutors", async (req, res) => {
      const tutors = await tutorsCollection.find().toArray();
      res.send(tutors);
    });
    
    app.get("/tutors/:id", async (req, res) => {
      const {id} = req.params.id;
      const query = {
        _id: new Object(id)
      }
      const result = await tutorsCollection.findOne(query);
      res.send(result);
    });

    app.post("/tutors", async (req, res) => {
      const tutor = req.body;
      const result = await tutorsCollection.insertOne(tutor);
      res.send({ insertedId: result.insertedId });
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
