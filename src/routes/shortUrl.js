const express = require("express");
const { PrismaClient } = require("@prisma/client");
const {} = require("../middleware/validate");
const auth = require("../middleware/auth");
const xprismaShorturl = require("../extensions/shorturlModel");
const {
  validateCreateUrl,
  validateUpdateUrl,
  validateDeleteUrl,
  validateShorturlRes,
} = require("../middleware/validateShorturl");
const router = new express.Router();
const prisma = new PrismaClient();

//create new short url
router.post(
  "/api/user/shorturl",
  auth,
  validateCreateUrl,
  validateShorturlRes,
  async (req, res) => {
    try {
      const shorturl = await xprismaShorturl.shorturl.createShort(
        req.user,
        req.body
      );
      if (!shorturl) return res.sendStatus(404);
      res.send(shorturl);
    } catch (e) {
      res.status(400).send(e);
    }
  }
);

// redirect shorturl(paramsUrl) to original url
router.get("/:shorturl", async (req, res) => {
  try {
    const urlparam = req.params.shorturl;
    if (!urlparam) return res.status(404).send({ error: "Kamu tersesat!" });
    const isShorturlExist = await prisma.shorturl.findUnique({
      where: {
        paramsUrl: urlparam,
      },
    });
    if (!isShorturlExist) {
      return res.status(404).send({ error: "Kamu tersesat!" });
    }
    if (isShorturlExist) {
      await prisma.shorturl.update({
        where: {
          id: isShorturlExist.id,
        },
        data: {
          views: {
            increment: 1,
          },
        },
      });
    }

    res.redirect(isShorturlExist.originalUrl);
  } catch (error) {
    res.status(500).send({ error });
  }
});

// update shorturl (only customUrl)
router.patch(
  "/api/user/:shorturl",
  auth,
  validateUpdateUrl,
  validateShorturlRes,
  async (req, res) => {
    try {
      const param = req.params.shorturl;
      const updateShortUrl = await xprismaShorturl.shorturl.updateShorturl(
        param,
        req.body
      );
      if (!updateShortUrl) return res.sendStatus(404);
      res.send({ updated: updateShortUrl });
    } catch (error) {
      res.sendStatus(404);
    }
  }
);

//delete shorturl
router.delete("/api/user/:shorturl", auth, validateDeleteUrl, validateShorturlRes, async (req, res) => {
  try {
    const delShorturl = await xprismaShorturl.shorturl.deleteShorturl(req.params.shorturl);
    if(!delShorturl) return res.sendStatus(404)
    res.send(delShorturl)
  } catch (error) {
    res.sendStatus(404)
  }

});

module.exports = router;
