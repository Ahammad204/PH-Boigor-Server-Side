//Initial index.js setup for server
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//Middleware
//Middleware
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      // 'https://phboigor.web.app'
      "https://boighors.netlify.app/"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//Logger Middleware
const logger = async (req, res, next) => {
  console.log("called: ", req.host, req.originalUrl, req.method, req.url);
  next();
};

const authenticateToken = (req, res, next) => {
  const token = req.headers.Cookie;

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }
    req.user = user;
    next();
  });
};

//Verify Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("value of token in middleware", token);

  if (!token) {
    return res.status(403).send({ message: "Not valid User" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    //error
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "Not valid User" });
    }

    //Decoded
    console.log("Value in the token", decoded);
    req.user = decoded;

    next();
  });
};

//port
const port = process.env.PORT || 5000;

//For knowing that server is working or not
app.get("/", (req, res) => {
  res.send("Server is Running....");
});

//For knowing which port we are use
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

//Connect to MongoDB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1qgivqu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //  await client.connect();

    const bookCollection = client.db("bookDB").collection("book");
    const categoryCollection = client.db("categoryDB").collection("category");
    const borrowedCollection = client.db("borrowedDB").collection("borrowed");
    const userCollection = client.db("userDB").collection("user");

    //Auth Related APi
    app.post("/jwt", logger, async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 0,
      });
      res.send({ success: true });
    });

    // POST /users
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user)

      // Check if user already exists
      const existingUser = await userCollection.findOne({ email: user.email });
      if (existingUser) {
        return res.send({ message: "User already exists" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // GET /users/:email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
      res.send(user);
    });

    //Post A Category
    app.post("/category", async (req, res) => {
      const newCategory = req.body;
      console.log(newCategory);
      const result = await categoryCollection.insertOne(newCategory);
      res.send(result);
    });

    //Get Category Data
    app.get("/category", async (req, res) => {
      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //Post A Book
    app.post("/book", verifyToken, async (req, res) => {
      const newBook = req.body;
      console.log(newBook);
      const result = await bookCollection.insertOne(newBook);
      res.send(result);
    });
    //Get All Book Data
    app.get("/book", async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //Post a Borrowed data
    app.post("/borrowed", async (req, res) => {
      const newBorrowed = req.body;
      const result = await borrowedCollection.insertOne(newBorrowed);
      res.send(result);
    });

    //Get All Borrowed Data basis of email
    app.get("/borrowed", verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const cursor = borrowedCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //Get Book Data for Update
    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.findOne(query);
      res.send(result);
      console.log(id);
    });

    //Update Book quantity data

    app.put("/book/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBook = req.body;
      const book = {
        $set: {
          quantity: updatedBook.quantity,
        },
      };

      const result = await bookCollection.updateOne(filter, book, options);
      res.send(result);
    });

    //Get Borrowed Data for Update
    app.get("/borrowed/:_id", async (req, res) => {
      const id = req.params._id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowedCollection.findOne(query);
      res.send(result);
      console.log(id);
    });

    //Delete Borrowed Data
    app.delete("/borrowed/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowedCollection.deleteOne(query);
      res.send(result);
    });

    //Update Book quantity data

    app.put("/book/:bookId", async (req, res) => {
      const id = req.params.bookId;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateQuantity = req.body;
      const book = {
        $set: {
          quantity: updateQuantity.quantity,
        },
      };
      const result = await bookCollection.updateOne(filter, book, options);
      res.send(result);
    });

    //Update Book data

    app.put("/book/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBook = req.body;
      const book = {
        $set: {
          name: updatedBook.name,
          category: updatedBook.category,
          quantity: updatedBook.quantity,
          AuthorsName: updatedBook.AuthorsName,
          short: updatedBook.short,
          rating2: updatedBook.rating2,
          photo: updatedBook.photo,
          bookContent: updatedBook.bookContent,
        },
      };

      const result = await bookCollection.updateOne(filter, book, options);
      res.send(result);
    });

    //Delete book  Data
    app.delete("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(query);
      res.send(result);
    });

    //Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
