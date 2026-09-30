import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUser,
  newUser,
  SignInUser,
  checkAuth,
  logout,
  googleAuth,
} from "../controllers/user.controller.js";
import { adminOnly } from "../middlewares/auth.js";
import { verifyToken } from "../middlewares/verifytoken.js";

const app = express.Router();
//route - /api/v1/user/check-auth
app.get("/check-auth", verifyToken, checkAuth);
//route - /api/v1/user/new
app.post("/new", newUser);
//route - /api/v1/user/google
app.post("/google", googleAuth);
//route - /api/v1/user/logout
app.post("/logout", logout);
//route - /api/v1/user/signin
app.post("/signin", SignInUser);
//route - /api/v1/user/all
app.get("/all", adminOnly, getAllUsers);
//route - /api/v1/user/dynamicID
app.route("/:id").get(adminOnly, getUser).delete(adminOnly, deleteUser);

export default app;
