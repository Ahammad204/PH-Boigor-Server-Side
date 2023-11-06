//Initial index.js setup for server
const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

//Middleware
app.use(cors({

  origin: [

    'http://localhost:5173'


  ],
  credentials: true

}));
app.use(express.json());

//port
const port = process.env.PORT || 5000;

//For knowing that server is working or not
app.get("/", (req, res) => {

  res.send("Server is Running....")

});

//For knowing which port we are use
app.listen(port, () => {

  console.log(`Server is running on port ${port}`);

})


//Connect to MongoDB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1qgivqu.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const bookCollection = client.db('bookDB').collection('book')
    const categoryCollection = client.db('categoryDB').collection('category')
    const borrowedCollection = client.db('borrowedDB').collection('borrowed')


    //Auth Related APi
    app.post('/jwt', async (req, res) => {

      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.cookie('token', token, {

        httpOnly: true,
        secure: true,

      }).send({ success: true })
    })

    /*     app.post('/logout', async (res, req) => {
    
          const user = req.body;
          res.send({ success: true })
    
        }) */

    //Post A Category
    app.post('/category', async (req, res) => {

      const newCategory = req.body;
      console.log(newCategory);
      const result = await categoryCollection.insertOne(newCategory)
      res.send(result)

    })

    //Get Category Data
    app.get('/category', async (req, res) => {

      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result)

    })

    //Post A Book 
    app.post('/book', async (req, res) => {

      const newBook = req.body;
      console.log(newBook)
      const result = await bookCollection.insertOne(newBook)
      res.send(result)

    })
    //Get All Book Data
    app.get('/book', async (req, res) => {

      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result)

    })

    //Post a Borrowed data
    app.post('/borrowed', async (req, res) => {

      const newBorrowed = req.body;
      const result = await borrowedCollection.insertOne(newBorrowed);
      res.send(result)

    })

    //Get All Borrowed Data
    app.get('/borrowed', async (req, res) => {

      let query = {};
      if (req.query?.email) {

        query = { email: req.query.email }

      }
      const cursor = borrowedCollection.find(query);
      const result = await cursor.toArray();
      res.send(result)

    })





    //Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);