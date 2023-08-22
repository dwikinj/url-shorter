const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env" });

const prisma = new PrismaClient();

const auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).send({ error: "Please auth!" });
    }
    const token = req.headers.authorization.replace("Bearer ", "");

    if (!token) return res.status(401).send({ error: "Please auth" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded) {
      const user = await prisma.user.findFirst({
        where: {
          AND: [
            { email: decoded.email },
            {password: decoded.password},
            { token: { some: { token: decoded.token } } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          birthday: true,
        },
      });
      if (user) {
        req.user = user;
        next();
      }

      if (!user) {
        return res.status(401).send({ error: "Please auth" });
      }
    } else {
      return res.status(401).send({ error: "Invalid Credentials" });
    }
  } catch (e) {
    return res.status(401).send({ error: e });
  }
};

module.exports = auth;
