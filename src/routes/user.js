const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { xprisma } = require("../extensions/userModel");
const {
  signUpValidate,
  signInValidate,
  updateValidate,
  validateRes,
} = require("../middleware/validate");
const auth = require("../middleware/auth");
const router = new express.Router();
const prisma = new PrismaClient();

//create new user (signup) user
router.post("/api/user", signUpValidate, validateRes, async (req, res) => {
  try {
    const user = await xprisma.user.signUp(req.body);
    if (!user) {
      return res.sendStatus(422);
    }
    return res.send(user);
  } catch (e) {
    if (e.code === "P2002") {
      return res
        .status(409)
        .send({ error: "Email already exist. please use another email" });
    }
    res.status(400).send({ error: e.message });
  }
});

// login (signin) user
router.post(
  "/api/user/login",
  signInValidate,
  validateRes,
  async (req, res) => {
    try {
      const user = await xprisma.user.signIn(req.body);
      res.status(200).send(user);
    } catch (e) {
      res.status(400).send({ error: e });
    }
  }
);

// logout (signout) user

router.post("/api/user/logout", auth, async (req, res) => {
  try {
    const deleteToken = await prisma.token.deleteMany({
      where: {
        userId: req.user.id,
      },
    });
    if (deleteToken.count === 0) return res.sendStatus(401);
    if (deleteToken.count > 0) return res.status(200).json("success");
  } catch (error) {
    res.status(404).send(error);
  }
});

// get profile user
router.get("/api/user", auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:{
        id: req.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        birthday: true,
        shortUrl: true
      }
    })

    if (!user) return res.status(404).json("User not found");
    return res.send(user);
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

// update user
router.patch(
  "/api/user",
  auth,
  updateValidate,
  validateRes,
  async (req, res) => {
    try {
      const user = await xprisma.user.updateUser(req);
      if (!user) return res.status(404).send({ error: "" });
      res.send(user);
    } catch (e) {
      res.send(404).send({ error: e });
    }
  }
);

//delete user
router.delete("/api/user", auth, async (req, res) => {
  try {
    const user = await prisma.user.delete({
      where: {
        email: req.user.email,
      },
    });
    if (user) {
      res.send({ message: `Success delete`, user: user });
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(404);
  }
});

module.exports = router;
