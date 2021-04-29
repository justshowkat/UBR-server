const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 5000;
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@1stcluster0.xmai6.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const serviceCollection = client
    .db(process.env.DB_NAME)
    .collection("services");
  const adminCollection = client
    .db(process.env.DB_NAME)
    .collection("adminList");
  const ordersCollection = client
    .db(process.env.DB_NAME)
    .collection("orderList");
  const ratingsCollection = client
    .db(process.env.DB_NAME)
    .collection("ratings");
  console.log(err);

  //this function add's new service to homepage
  app.post("/add-service", (req, res) => {
    serviceCollection.insertOne(req.body).then((result) => {
      result.insertedCount === 1 ? res.send("success") : "";
    });
  });

  //this fetch all the services
  app.get("/all-services", (req, res) => {
    serviceCollection.find({}).toArray((err, doc) => {
      res.send(doc);
    });
  });

  //delete a service
  app.delete("/delete-service/:id", (req, res) => {
    serviceCollection
      .deleteOne({ _id: ObjectId(req.params.id) })
      .then((result) => console.log(result));
  });

  // Update a service
  app.patch("/update-order/:id", (req, res) => {
    ordersCollection
      .updateOne(
        { _id: ObjectId(req.params.id) },
        {
          $set: { status: req.body.changeStatus },
        }
      )
      .then((result) => {
        result.matchedCount === 1 && res.send("success");
      });
  });

  //this adds new admin
  app.post("/add-admin", (req, res) => {
    adminCollection.insertOne(req.body).then((result) => {
      result.insertedCount === 1 ? res.send("success") : "";
    });
  });

  //this fetch all the services
  app.get("/admins", (req, res) => {
    adminCollection.find({}).toArray((err, doc) => {
      res.send(doc);
    });
  });

  //this is to check if the user is admin or not
  app.get("/admins/:mail", (req, res) => {
    adminCollection.find({ email: req.params.mail }).toArray((err, data) => {
      err ? console.log(err) : data === [] ? res.send(data) : res.send(data[0]);
    });
  });

  //this function books new service from customer
  app.post("/book-service", (req, res) => {
    ordersCollection.insertOne(req.body).then((result) => {
      result.insertedCount === 1 ? res.send("success") : "";
    });
  });

  //this fetch all the services
  app.get("/orders", (req, res) => {
    ordersCollection.find({}).toArray((err, doc) => {
      res.send(doc);
    });
  });

  //this is to find user specific orders
  app.get("/order/:mail", (req, res) => {
    ordersCollection.find({ email: req.params.mail }).toArray((err, data) => {
      err ? console.log(err) : res.send(data);
    });
  });

  //this adds new rating to database
  app.post("/add-rating", (req, res) => {
    ratingsCollection.insertOne(req.body).then((result) => {
      result.insertedCount === 1 ? res.send("success") : "";
    });
  });

  //this get's rating from database
  app.get("/rating/:mail", (req, res) => {
    ratingsCollection.find({ email: req.params.mail }).toArray((err, data) => {
      err ? console.log(err) : res.send(data);
    });
  });


  //this get's rating from database
  app.get("/rating", (req, res) => {
    ratingsCollection.find({}).toArray((err, data) => {
      err ? console.log(err) : res.send(data);
    });
  });


  //delete a review
  app.delete("/delete-review/:id", (req, res) => {
    ratingsCollection
      .deleteOne({ _id: ObjectId(req.params.id) })
      .then((result) => console.log(result));
  });
});

//all the stripe code here
const stripe = require("stripe")(
  "sk_test_51IhOGYBAygCepCcSkKuyd1Dd7eZIL8RvDFdFKJtYfFfuZedQQJTn94m8TopRAnxzQDFkXxTbeO2eUTu5ZKCA0zAs00SU2oeGIz"
);
app.use(express.static("."));
app.use(express.json());
const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400;
};
const chargeCustomer = async (customerId) => {
  // Lookup the payment methods available for the customer
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });
  // Charge the customer and payment method immediately
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1099,
    currency: "usd",
    customer: customerId,
    payment_method: paymentMethods.data[0].id,
    off_session: true,
    confirm: true,
  });
  if (paymentIntent.status === "succeeded") {
    console.log("✅ Successfully charged card off session");
  }
};
app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;
  // Alternatively, set up a webhook to listen for the payment_intent.succeeded event
  // and attach the PaymentMethod to a new Customer
  console.log(req.body);
  const customer = await stripe.customers.create();
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    customer: customer.id,
    setup_future_usage: "off_session",
    amount: calculateOrderAmount(items),
    currency: "usd",
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
