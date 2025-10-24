import dotenv from "dotenv";
dotenv.config();

import connectDB from "../config/db.js";

// call factory:
// import { createFakeUser } from "./userFactory.js";

const run = async () => {
  try {
    await connectDB();

    console.log("🔹 Creating fake users...");

    
    for (let i = 0; i < 5; i++) {

      const user = await createFakeUser();
      console.log("✅ User created:", user.email);

    }

    console.log("🎉 All users created!");

    await (await import("mongoose")).disconnect();
    console.log("🔴 Database disconnected");

    process.exit();
  } catch (err) {
    console.error("Error running factory:", err);
    process.exit(1);
  }
};

run();