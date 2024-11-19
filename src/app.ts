import mongoose from "mongoose";
import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import swaggerJSDoc from "./swagger.json";
import swaggerUI from "swagger-ui-express";
import cookieParser from "cookie-parser";
import router from "./routes/index.ts";

const app = express();
dotenv.config({ path: "./config/config.env" });

app.use(
  cors({
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve Swagger Documentation
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJSDoc));

const server = http.createServer(app);

const connectToDb = async () => {
  const uri =
    "mongodb+srv://matheusqo1:DgaIySNIQjU4xtrf@seugarcom1.ywmykl2.mongodb.net/?retryWrites=true&w=majority&appName=SeuGarcom1";

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });

    console.log("We are connected");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

connectToDb();

server.listen(3333, () => {
  console.log("Is running on http://localhost:3333");
});

app.use("/", router());
