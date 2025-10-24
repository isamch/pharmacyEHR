import express from "express";
import { getAll__NAME__, get__NAME__, create__NAME__, update__NAME__, delete__NAME__ } from "../controllers/__NAME__.controller.js";

// import { registerSchema, loginSchema } from "../../validations/validatorSchema.js";
// import { validate } from '../../middleware/validatorMiddleware.js'

// import { authMiddleware } from '../../middleware/authMiddleware.js';







const router = express.Router();




router.get("/", getAll__NAME__);
router.get("/:id", get__NAME__);
router.post("/", create__NAME__);
router.put("/:id", update__NAME__);
router.delete("/:id", delete__NAME__);


export default router;
