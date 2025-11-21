import { default as express } from "express";
import crypto from "crypto";
import cors from "cors";
import "dotenv/config";
import { AppError }  from "./errors/AppError.js";
import { ValidationError } from "./errors/ValidationError.js";
import { exit } from "process";
import { prisma } from "./middleware/prisma.mjs";
import expressSession from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { env } from 'node:process'


if (!env.SESSION_SECRET) {
  console.log("found no session secret in .env, so must create one");
  const b = crypto.randomBytes(40); // any number over 32 is fine
  console.log(
    `Setup the SESSION_SECRET value in .env with: ${b.toString("hex")}`
  );
  exit(1)
}


const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cors({
    origin: "*",
    //origin: "http://localhost:3000", // or your frontend origin
    credentials: true, // allow cookies
  })
);

app.use((req, res, next) => { console.log(req.params); next() })
app.use(
  expressSession({
    cookie: {
      name: "hbar1st-waldo.sid",
      httpOnly: true,
      secure: env.NODE_ENV === "production" ? true : false,
      sameSite: env.NODE_ENV === "production"? "none" : "strict", // required for cross-origin cookies
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);


// just sets up the basic route that describes the api
import { indexRouter } from "./routers/indexRouter.js";
app.use("/", indexRouter);

// Catch-all for unhandled routes (must be placed last but before error handler)
app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `This is a surprising request. I can't find ${req.originalUrl} on this server!`,
  });
});

const INTERNAL_ERROR =
  "Internal Server Error. Contact support if this error persists.";

// catch-all for errors
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const timestamp = new Date().toUTCString();
  res.set({ "Content-Type": "application/problem+json" }); // this type from https://datatracker.ietf.org/doc/html/rfc7807#section-3
  try {
    console.log("================================================");
    console.error("in the catch-all: ", timestamp, err, err.stack);

    console.log(Object.getPrototypeOf(err)); // [AppError]

    console.log(err instanceof AppError); //false

    console.log(err.name);

    if (err instanceof AppError || err.name === "AppError") {
      {
        res.status(err.statusCode);
        if (err instanceof ValidationError) {
          res.json({
            statusCode: err.statusCode,
            timestamp: err.timestamp,
            message: err.message,
            details: err.details,
          });
        } else {
          res.json({
            statusCode: err.statusCode,
            timestamp: err.timestamp,
            message: err.message,
          });
        }
      }
      if (res.statusCode < 400) {
        res.status(500);
        console.log(
          "TODO: fix up whomever sent this error up here without setting the status?"
        );
        res.json({
          statusCode: 500,
          timestamp,
          message: INTERNAL_ERROR,
        });
      } else if (!(err instanceof AppError)) {
        res.status(500).json({ timestamp, message: INTERNAL_ERROR });
      }
    } else {
      console.log("this error is not an instance of AppError");
      res.status(500).json({ timestamp, message: INTERNAL_ERROR });
    }
  } catch (error) {
    // don't let any error pass thru!
    res.status(500).json({ timestamp, message: INTERNAL_ERROR });
  }
});

export { app };
