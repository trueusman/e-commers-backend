import express from "express";

const router = express.Router();

router.get("/muhammad", (req, res) => {
  res.send("muhammad 1 ");
});

router.get("/usman", (req, res) => {
  res.send("usman");
});

router.get("/ghani", (req, res) => {
  res.send("ghani");
});

export default router;