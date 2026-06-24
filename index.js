const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const { createRemoteJWKSet } = require("jose-cjs");

// 1. Load environment variables (First priority)
dotenv.config();

const app = express();
const port = process.env.SERVER_PORT;

// 2. Middleware configuration (Right after initializing app)
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_DB_URI;

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
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );

    const database = client.db("cookly");
    const usersCollection = database.collection("user");
    const recipesCollection = database.collection("recipes");

    const favoritesCollection = database.collection("favorites");
    const reportsCollection = database.collection("reports");
    const plansCollection = database.collection("plans");
    const subscriptionsCollection = database.collection("subscriptions");
    const recipePaymentsCollection = database.collection("recipePayments");
    //

    // Add a new recipe
    //    app.post("/api/recipes", async (req, res) => {
    //      try {
    //        const recipe = req.body;
    //        const result = await recipesCollection.insertOne(recipe);
    //        res.status(201).json(result);
    //      } catch (error) {
    //        console.error("Error creating recipe:", error);
    //        res.status(500).json({ error: "Internal Server Error" });
    //      }
    //    });

    app.get("/auth/users", (req, res) => {
      const query = {};
      if (req.query.email) {
        query.email = req.query.email;
      }
      usersCollection
        .findOne(query)
        .then((result) => {
          res.json(result);
        })
        .catch((error) => {
          console.error("Error fetching user:", error);
          res.status(500).json({ error: "Internal Server Error" });
        });
    });
    //    app.get("/api/recipes", async (req, res) => {
    //      try {
    //        const cursor = recipesCollection.find({});
    //        const result = await cursor.toArray();
    //        res.json(result);
    //      } catch (error) {
    //        console.error("Error fetching recipes:", error);
    //        res.status(500).json({ error: "Internal Server Error" });
    //      }
    //    });

    // Recipe Details
    // app.get("/recipes/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = {
    //     _id: new ObjectId(id),
    //   };
    //   const result = await recipesCollection.findOne(query);
    //   res.send(result);
    // });

    // POST: Create a new Recipe post
    app.post("/api/recipes", async (req, res) => {
      try {
        const recipe = req.body;

        const newRecipe = {
          ...recipe,
          createdAt: new Date(),
        };

        console.log("Inserting Recipe:", newRecipe);
        const result = await recipesCollection.insertOne(newRecipe);

        res.status(201).send({
          success: true,
          message: "Recipe added successfully! 🎉",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Recipe Insert Error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to add recipe. Database error!",
        });
      }
    });

    // Update recipe
    app.patch("/api/recipes/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await recipesCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: req.body,
          },
        );

        console.log(result, "resultgfisdgfiuasdfigsdiuf");

        res.send({
          success: true,
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Delete Recipeeee
    app.delete("/api/recipes/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await recipesCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send({
          success: true,
          message: "Recipe Deleted",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // GET: Fetch all recipes with optional filtering
    app.get("/api/recipes", async (req, res) => {
      try {
        const query = {};
        if (req.query.authorId) {
          query.authorId = req.query.authorId;
        }
        if (req.query.status) {
          query.status = req.query.status;
        }

        const cursor = recipesCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });



    
    app.get("/api/recipes/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const recipe = await recipesCollection.findOne({
          _id: new ObjectId(id),
        });

        res.send(recipe);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // /api/plans?plan_id=${planId}
    // // Get Plans Limitation

    app.get("/api/plans", async (req, res) => {
      const query = {};
      if (req.query.plan_id) {
        query.id = req.query.plan_id;
      }

      const plan = await plansCollection.findOne(query);
      res.send(plan);
    });

    // favorite recipes
    app.post("/api/favorites", async (req, res) => {
      try {
        const favoriteData = req.body;

        const alreadyExist = await favoritesCollection.findOne({
          userId: favoriteData.userId,
          recipeId: favoriteData.recipeId,
        });

        if (alreadyExist) {
          return res.send({
            success: false,
            message: "Already Added",
          });
        }

        const result = await favoritesCollection.insertOne({
          ...favoriteData,
          addedAt: new Date(),
        });

        res.send({
          success: true,
          message: "Added To Favorites",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Get Favorite Recipes
    app.post("/api/recipe/favorites", async (req, res) => {
      try {
        const favoriteData = req.body;

        const alreadyExist = await favoritesCollection.findOne({
          userId: favoriteData.userId,
          recipeId: favoriteData.recipeId,
        });

        if (alreadyExist) {
          return res.send({
            success: false,
            message: "Already Added",
          });
        }

        const result = await favoritesCollection.insertOne({
          ...favoriteData,
          addedAt: new Date(),
        });

        res.send({
          success: true,
          message: "Added To Favorites",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Delete Favorite Recipe
    app.delete("/api/favorites/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await favoritesCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send({
          success: true,
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Reportt
    app.post("/api/recipe/reports", async (req, res) => {
      try {
        const report = req.body;

        const result = await reportsCollection.insertOne({
          ...report,
          status: "pending",
          createdAt: new Date(),
        });

        res.send({
          success: true,
          message: "Report Submitted",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // get all reports

    app.get("/api/recipe/reports", async (req, res) => {
      try {
        const result = await reportsCollection.find({}).toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Like a Recipe
    app.patch("/api/recipes/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await recipesCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $inc: {
              likesCount: 1,
            },
          },
        );

        res.send({
          success: true,
          message: "Recipe Liked",
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Recipet pyment collection
    app.post("/api/recipePayments", async (req, res) => {
      const data = req.body;

      console.log(data, "dataa");
      const subsInfo = {
        ...data,
        paidAt: new Date(),
      };

      const result = await recipePaymentsCollection.insertOne(subsInfo);

      res.send(result);
    });

    // subscriptionss
    app.post("/api/subscriptions", async (req, res) => {
      const data = req.body;

      console.log(data, "dataa");
      const subsInfo = {
        ...data,
        createAt: new Date(),
      };

      const result = await subscriptionsCollection.insertOne(subsInfo);

      // Update the user plane

      const filter = { email: data.email };
      const updateDocunent = {
        $set: {
          plan: data.planId,
        },
      };

      const updateResult = await usersCollection.updateOne(
        filter,
        updateDocunent,
      );

      res.send(updateResult);
    });

    // get User For admin
    app.get("/api/manage_users", async (req, res) => {
      try {
        const result = await usersCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });
    // Block User
    app.patch("/api/manage_users/block/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await usersCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              isBlocked: true,
            },
          },
        );
        console.log(result, "block skfdgsk");
        res.send({
          success: true,
          message: "User Blocked",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Unblock user
    app.patch("/api/manage_users/unblock/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await usersCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              isBlocked: false,
            },
          },
        );

        res.send({
          success: true,
          message: "User Unblocked",
          result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
