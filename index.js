require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

const cors = require("cors");

app.use(cors());
app.use(express.json());

// const uri = process.env.DB_URL;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gplljg9.mongodb.net/?retryWrites=true&w=majority`;
// const uri = "mongodb+srv://reshad:8lEh1VXhe5LOuQne@cluster0.gplljg9.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const run = async () => {
  try {
    // const db = client.db("jobboxDb");
    // const userCollection = db.collection("user");
    // const jobCollection = db.collection("job");

    const userCollection = client.db("jobboxDb").collection("user");
    const jobCollection = client.db("jobboxDb").collection("job");

    app.post("/user", async (req, res) => {
      try {
        const user = req.body;
        console.log(user);

        const result = await userCollection.insertOne(user);
        res.status(200).json({ success: true, data: result });

      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "An error occurred" });
      }


    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;

      const result = await userCollection.findOne({ email });

      if (result?.email) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    app.patch("/apply", async (req, res) => {
      const userId = req.body.userId;
      const jobId = req.body.jobId;
      const email = req.body.email;

      const filter = { _id: ObjectId(jobId) };
      const updateDoc = {
        $push: { applicants: { id: ObjectId(userId), email } },
      };

      const result = await jobCollection.updateOne(filter, updateDoc);

      if (result.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    app.patch("/query", async (req, res) => {
      const userId = req.body.userId;
      const jobId = req.body.jobId;
      const email = req.body.email;
      const question = req.body.question;

      const filter = { _id: ObjectId(jobId) };
      const updateDoc = {
        $push: {
          queries: {
            id: ObjectId(userId),
            email,
            question: question,
            reply: [],
          },
        },
      };

      const result = await jobCollection.updateOne(filter, updateDoc);

      if (result?.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    app.patch("/reply", async (req, res) => {
      const userId = req.body.userId;
      const reply = req.body.reply;
      console.log(reply);
      console.log(userId);

      const filter = { "queries.id": ObjectId(userId) };

      const updateDoc = {
        $push: {
          "queries.$[user].reply": reply,
        },
      };
      const arrayFilter = {
        arrayFilters: [{ "user.id": ObjectId(userId) }],
      };

      const result = await jobCollection.updateOne(
        filter,
        updateDoc,
        arrayFilter
      );
      if (result.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    app.get("/applied-jobs/:email", async (req, res) => {
      const email = req.params.email;
      const query = { applicants: { $elemMatch: { email: email } } };
      const cursor = jobCollection.find(query).project({ applicants: 0 });
      const result = await cursor.toArray();

      res.send({ status: true, data: result });
    });

    app.get("/jobs", async (req, res) => {
      const cursor = jobCollection.find({});
      const result = await cursor.toArray();
      res.send({ status: true, data: result });
    });

    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;

      const result = await jobCollection.findOne({ _id: ObjectId(id) });
      res.send({ status: true, data: result });
    });

    app.post("/job", async (req, res) => {
      const job = req.body;

      const result = await jobCollection.insertOne(job);

      res.send({ status: true, data: result });
    });

    app.get('/search/:key', async (req, res) => {
      try {
        const searchText = req.params.key;
        const query = {
          "$or": [
            { position: { $regex: searchText, $options: 'i' } },
            // { description: { $regex: searchText, $options: 'i' } },
          ],
        };
        const result = await jobCollection.find(query).toArray();
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "An error occurred" });
      }
    });

  } finally {
  }
};

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Database Connection Successfully..!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
