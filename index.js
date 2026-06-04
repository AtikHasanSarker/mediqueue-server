const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
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

const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log("payload from jwt:", payload);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    await client.connect();
    const db = client.db("mediqueue");
    const tutorsCollection = db.collection("tutors");
    const bookedSessionsCollection = db.collection("booked-sessions");
    console.log("Successfully Connected to MongoDB: mediqueue");

    // with searching and sorting
    app.get("/tutors", async (req, res) => {
      const { search, date } = req.query;
      let cursor;

      //search
      if (search?.trim()) {
        cursor = await tutorsCollection.find({
          $or: [
            {
              name: {
                $regex: search,
                $options: "i",
              },
            },
            {
              subject: {
                $regex: search,
                $options: "i",
              },
            },
            {
              institution: {
                $regex: search,
                $options: "i",
              },
            },
            {
              location: {
                $regex: search,
                $options: "i",
              },
            },
            {
              teachingMode: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        });
      } else if (date) {
        cursor = await tutorsCollection.find({
          sessionStartDate: {
            $gte: date,
          },
        });
      } else {
        cursor = tutorsCollection.find();
      }
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/availableTutors", async (req, res) => {
      const tutors = await tutorsCollection.find().skip(3).limit(6).toArray();
      res.json(tutors);
    });

    app.post("/tutors", verifyToken, async (req, res) => {
      const tutorData = req.body;
      const result = await db.collection("tutors").insertOne(tutorData);
      res.json(result);
    });

    app.get("/tutors/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await tutorsCollection.findOne(query);
      res.json(result);
    });

    app.delete("/tutors/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await tutorsCollection.deleteOne(query);
      res.json(result);
    });

    app.patch("/tutors/:id", async (req, res) => {
      const { id } = req.params;

      const result = await tutorsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $inc: {
            totalSlot: -1,
          },
        },
      );
      res.json(result);
    });

    app.get("/my-tutors/:userId", async (req, res) => {
      const { userId } = req.params;
      const query = {
        userId: userId,
      };
      const tutors = await tutorsCollection.find(query).toArray();
      res.json(tutors);
    });

    app.patch("/my-tutors/:id", verifyToken, async (req, res) => {
      const { id } = req.params;

      const result = await tutorsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body },
      );
      res.json(result);
    });

    app.post("/booked-sessions", verifyToken, async (req, res) => {
      const bookingData = req.body;
      const result = await bookedSessionsCollection.insertOne(bookingData);
      res.json(result);
    });

    app.get("/booked-sessions/:userId", async (req, res) => {
      const { userId } = req.params;
      const query = {
        userId: userId,
      };
      const bookedSessions = await bookedSessionsCollection
        .find(query)
        .toArray();
      res.json(bookedSessions);
    });

    app.patch("/booked-sessions/:id", async (req, res) => {
      const id = req.params.id;

      const result = await bookedSessionsCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            status: "Cancelled",
          },
        },
      );

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
