
// const dns = require("dns");

// // ======================================================
// // FIX NODE.JS DNS FOR MONGODB SRV
// // ======================================================

// dns.setServers([
//   "1.1.1.1",
//   "8.8.8.8",
// ]);

// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");

// const authMiddleware = require("./authMiddleware");
// const Category = require("./models/Category");

// const app = express();

// // ======================================================
// // BASIC MIDDLEWARE
// // ======================================================

// app.use(cors());

// app.use(
//   express.json({
//     limit: "10mb",
//   })
// );

// app.use(
//   express.urlencoded({
//     extended: true,
//     limit: "10mb",
//   })
// );

// // ======================================================
// // DEBUG MIDDLEWARE
// // ======================================================

// app.use((req, res, next) => {
//   console.log("\n====================================");
//   console.log("REQUEST:", req.method, req.originalUrl);
//   console.log("CONTENT-TYPE:", req.headers["content-type"]);
//   console.log("BODY:", req.body);
//   console.log("====================================\n");

//   next();
// });

// // ======================================================
// // UPLOADS FOLDER
// // ======================================================

// const uploadsPath = path.join(__dirname, "uploads");

// if (!fs.existsSync(uploadsPath)) {
//   fs.mkdirSync(uploadsPath, {
//     recursive: true,
//   });
// }

// app.use(
//   "/uploads",
//   express.static(uploadsPath)
// );

// // ======================================================
// // ADMIN DASHBOARD STATIC FILES
// // ======================================================

// const adminPath = path.join(
//   __dirname,
//   "public"
// );

// app.use(
//   express.static(adminPath)
// );

// // ======================================================
// // MONGODB CONNECTION
// // ======================================================

// const ONLINE_MONGO_URI =
//   "mongodb+srv://Vicky:Vicky123456789@cluster0.nobzodb.mongodb.net/my-blog-db?retryWrites=true&w=majority&appName=Cluster0";

// // ======================================================
// // DEFAULT CATEGORIES
// // ======================================================

// const seedCategories = async () => {
//   try {
//     const defaults = [
//       {
//         id: "sports",
//         title: "Sports",
//         description: "Sports news",
//         image: "",
//       },
//       {
//         id: "hollywood",
//         title: "Hollywood",
//         description: "Hollywood news",
//         image: "",
//       },
//       {
//         id: "bollywood",
//         title: "Bollywood",
//         description: "Bollywood news",
//         image: "",
//       },
//       {
//         id: "webseries-ott",
//         title: "Webseries OTT",
//         description: "OTT & Webseries",
//         image: "",
//       },
//     ];

//     for (const cat of defaults) {
//       const exists = await Category.findOne({
//         id: cat.id,
//       });

//       if (!exists) {
//         await Category.create(cat);
//       }
//     }

//     console.log("✅ Default categories ready");
//   } catch (error) {
//     console.error(
//       "❌ Category seed error:",
//       error.message
//     );
//   }
// };

// // ======================================================
// // API ROUTES
// // ======================================================

// app.use(
//   "/api/categories",
//   require("./routes/categoryRoutes")
// );

// app.use(
//   "/api/posts",
//   require("./routes/postRoutes")
// );

// app.use(
//   "/api/upload",
//   require("./routes/uploadRoutes")
// );

// app.use(
//   "/api/auth",
//   require("./routes/authRoutes")
// );

// app.use(
//   "/api/dashboard",
//   require("./routes/dashboardRoutes")
// );

// app.use(
//   "/api/comments",
//   require("./routes/commentRoutes")
// );

// app.use(
//   "/api/users",
//   require("./routes/userRoutes")
// );

// // ======================================================
// // ROOT ROUTE
// // ======================================================

// app.get("/", (req, res) => {
//   res.redirect("/admin/index.html");
// });

// // ======================================================
// // JWT PROTECTED TEST ROUTE
// // ======================================================

// app.get(
//   "/api/auth/me",
//   authMiddleware,
//   (req, res) => {
//     res.status(200).json({
//       success: true,
//       message: "Authentication successful",
//       user: req.user,
//     });
//   }
// );

// // ======================================================
// // 404 API HANDLER
// // ======================================================

// app.use("/api", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "API endpoint not found",
//     path: req.originalUrl,
//   });
// });

// // ======================================================
// // GLOBAL ERROR HANDLER
// // ======================================================

// app.use((err, req, res, next) => {
//   console.error(
//     "❌ GLOBAL ERROR:",
//     err
//   );

//   res.status(500).json({
//     success: false,
//     message:
//       err.message ||
//       "Internal Server Error",
//   });
// });

// // ======================================================
// // MONGOOSE EVENTS
// // ======================================================

// mongoose.connection.on(
//   "connected",
//   () => {
//     console.log("🟢 Mongoose connected");
//   }
// );

// mongoose.connection.on(
//   "error",
//   (error) => {
//     console.error(
//       "🔴 Mongoose error:",
//       error.message
//     );
//   }
// );

// mongoose.connection.on(
//   "disconnected",
//   () => {
//     console.log(
//       "🟡 MongoDB disconnected"
//     );
//   }
// );

// // ======================================================
// // START SERVER
// // ======================================================

// const PORT = 5000;

// const startServer = async () => {
//   try {
//     console.log(
//       "🔄 Connecting to MongoDB..."
//     );

//     await mongoose.connect(
//       ONLINE_MONGO_URI,
//       {
//         serverSelectionTimeoutMS: 15000,
//       }
//     );

//     console.log(
//       "🔥 Backend connected to MongoDB Cloud!"
//     );

//     await seedCategories();

//     app.listen(PORT, () => {
//       console.log(
//         `🚀 Server is running on port ${PORT}`
//       );

//       console.log(
//         `🌐 http://localhost:${PORT}`
//       );
//     });

//   } catch (error) {
//     console.error(
//       "\n❌ MongoDB Connection Failed!"
//     );

//     console.error(
//       "ERROR:",
//       error.message
//     );

//     console.error(
//       "\nPossible reasons:"
//     );

//     console.error(
//       "1. DNS problem"
//     );

//     console.error(
//       "2. MongoDB Atlas deployment is still processing"
//     );

//     console.error(
//       "3. Database username/password is incorrect"
//     );

//     console.error(
//       "4. IP Access List problem"
//     );

//     console.error(
//       "5. MongoDB cluster is unavailable"
//     );

//     process.exit(1);
//   }
// };

// // ======================================================
// // RUN
// // ======================================================

// startServer();
const dns = require("dns");

// ======================================================
// FIX NODE.JS DNS FOR MONGODB SRV
// ======================================================

dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authMiddleware = require("./authMiddleware");
const Category = require("./models/Category");

const app = express();

// ======================================================
// BASIC MIDDLEWARE
// ======================================================

app.use(cors());

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ======================================================
// DEBUG MIDDLEWARE
// ======================================================

app.use((req, res, next) => {
  console.log("\n====================================");
  console.log("REQUEST:", req.method, req.originalUrl);
  console.log("CONTENT-TYPE:", req.headers["content-type"]);
  console.log("BODY:", req.body);
  console.log("====================================\n");

  next();
});

// ======================================================
// UPLOADS FOLDER
// ======================================================

const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, {
    recursive: true,
  });
}

app.use(
  "/uploads",
  express.static(uploadsPath)
);

// ======================================================
// ADMIN DASHBOARD STATIC FILES
// ======================================================

const adminPath = path.join(
  __dirname,
  "public"
);

app.use(
  express.static(adminPath)
);

// ======================================================
// MONGODB CONNECTION
// ======================================================

const ONLINE_MONGO_URI =
  "mongodb+srv://Vicky:Vicky123456789@cluster0.nobzodb.mongodb.net/my-blog-db?retryWrites=true&w=majority&appName=Cluster0";

// ======================================================
// DEFAULT CATEGORIES
// ======================================================

const seedCategories = async () => {
  try {
    const defaults = [
      {
        id: "sports",
        title: "Sports",
        description: "Sports news",
        image: "",
      },
      {
        id: "hollywood",
        title: "Hollywood",
        description: "Hollywood news",
        image: "",
      },
      {
        id: "bollywood",
        title: "Bollywood",
        description: "Bollywood news",
        image: "",
      },
      {
        id: "webseries-ott",
        title: "Webseries OTT",
        description: "OTT & Webseries",
        image: "",
      },
    ];

    for (const cat of defaults) {
      const exists = await Category.findOne({
        id: cat.id,
      });

      if (!exists) {
        await Category.create(cat);
      }
    }

    console.log("✅ Default categories ready");
  } catch (error) {
    console.error(
      "❌ Category seed error:",
      error.message
    );
  }
};

// ======================================================
// API ROUTES
// ======================================================

app.use(
  "/api/categories",
  require("./routes/categoryRoutes")
);

app.use(
  "/api/posts",
  require("./routes/postRoutes")
);

app.use(
  "/api/upload",
  require("./routes/uploadRoutes")
);

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use(
  "/api/dashboard",
  require("./routes/dashboardRoutes")
);

app.use(
  "/api/comments",
  require("./routes/commentRoutes")
);

app.use(
  "/api/users",
  require("./routes/userRoutes")
);

app.use(
  "/api/webstories",
  require("./routes/webStoryRoutes")
);

// ======================================================
// ROOT ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.redirect("/admin/index.html");
});

// ======================================================
// JWT PROTECTED TEST ROUTE
// ======================================================

app.get(
  "/api/auth/me",
  authMiddleware,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Authentication successful",
      user: req.user,
    });
  }
);

// ======================================================
// 404 API HANDLER
// ======================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error(
    "❌ GLOBAL ERROR:",
    err
  );

  res.status(500).json({
    success: false,
    message:
      err.message ||
      "Internal Server Error",
  });
});

// ======================================================
// MONGOOSE EVENTS
// ======================================================

mongoose.connection.on(
  "connected",
  () => {
    console.log("🟢 Mongoose connected");
  }
);

mongoose.connection.on(
  "error",
  (error) => {
    console.error(
      "🔴 Mongoose error:",
      error.message
    );
  }
);

mongoose.connection.on(
  "disconnected",
  () => {
    console.log(
      "🟡 MongoDB disconnected"
    );
  }
);

// ======================================================
// START SERVER
// ======================================================

const PORT = 5000;

const startServer = async () => {
  try {
    console.log(
      "🔄 Connecting to MongoDB..."
    );

    await mongoose.connect(
      ONLINE_MONGO_URI,
      {
        serverSelectionTimeoutMS: 15000,
      }
    );

    console.log(
      "🔥 Backend connected to MongoDB Cloud!"
    );

    await seedCategories();

    app.listen(PORT, () => {
      console.log(
        `🚀 Server is running on port ${PORT}`
      );

      console.log(
        `🌐 http://localhost:${PORT}`
      );
    });

  } catch (error) {
    console.error(
      "\n❌ MongoDB Connection Failed!"
    );

    console.error(
      "ERROR:",
      error.message
    );

    console.error(
      "\nPossible reasons:"
    );

    console.error(
      "1. DNS problem"
    );

    console.error(
      "2. MongoDB Atlas deployment is still processing"
    );

    console.error(
      "3. Database username/password is incorrect"
    );

    console.error(
      "4. IP Access List problem"
    );

    console.error(
      "5. MongoDB cluster is unavailable"
    );

    process.exit(1);
  }
};

// ======================================================
// RUN
// ======================================================

startServer();