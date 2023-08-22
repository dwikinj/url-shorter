const { PrismaClient, Prisma } = require("@prisma/client");
const { body, validationResult, param } = require("express-validator");

const prisma = new PrismaClient();

const validateCreateUrl = [
  body("url")
    .exists()
    .withMessage("url required")
    .bail()
    .isURL({ protocols: ["http", "https"] })
    .withMessage("Invalid URL")
    .customSanitizer((value) => {
      const isProtocolExist = /https?:\/\//;
      if (!isProtocolExist.test(value)) return "https://" + value;
      return value;
    }),

  body("customUrl")
    .optional()
    .isString()
    .withMessage("custom url must be string")
    .bail()
    .isLength({
      min: 6,
    })
    .withMessage("Minimum 6 character")
    .trim()
    .custom(async (value) => {
      const regexValidUrlCustom = /^[a-zA-Z0-9_-]+$/;
      if (!regexValidUrlCustom.test(value)) {
        throw new Error("Only alphabet, number, '-', and '_' accepted");
      }
      const isUrlCustomDUplicate = await prisma.shorturl.findUnique({
        where: {
          paramsUrl: value,
        },
      });
      console.log(isUrlCustomDUplicate);
      if (isUrlCustomDUplicate) {
        throw new Error("Custom url already used, please choose another");
      }
    }),
];

const validateUpdateUrl = [
  param("shorturl")
    .exists()
    .isLength({
      min: 6,
    })
    .bail()
    .custom(async (value, { req }) => {
      const user = await prisma.user.findFirst({
        where: {
          AND: [
            { id: req.user.id },
            {
              shortUrl: {
                some: {
                  paramsUrl: value,
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      if (!user) throw new Error("Upss, something wrong from validateShorturl");
    }),

  body("customUrl")
    .exists()
    .withMessage("Custom url must be provided")
    .isString()
    .withMessage("custom url must be string")
    .bail()
    .isLength({
      min: 6,
    })
    .withMessage("Minimum 6 character")
    .trim()
    .custom(async (value) => {
      const regexValidUrlCustom = /^[a-zA-Z0-9_-]+$/;
      if (!regexValidUrlCustom.test(value)) {
        throw new Error("Only alphabet, number, '-', and '_' accepted");
      }
      const isUrlCustomDUplicate = await prisma.shorturl.findUnique({
        where: {
          paramsUrl: value,
        },
      });
      if (isUrlCustomDUplicate) {
        throw new Error("Custom url already used, please choose another");
      }
    })
    .customSanitizer((value) => {
      return value.trim();
    }),
];

const validateDeleteUrl = [
  param("shorturl")
    .exists()
    .isLength({
      min: 6,
    })
    .bail()
    .custom(async (value, { req }) => {
      const user = await prisma.user.findFirst({
        where: {
          AND: [
            { id: req.user.id },
            {
              shortUrl: {
                some: {
                  paramsUrl: value,
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
      if (!user) throw new Error("Upss, something wrong from validateShorturl");
    }),

  
];

const validateShorturlRes = async (req, res, next) => {
  const checkErrors = validationResult(req);
  if (!checkErrors.isEmpty()) {
    return res.status(400).send({ errors: checkErrors.array()[0].msg });
  }
  next();
};

module.exports = {
  validateCreateUrl,
  validateUpdateUrl,
  validateDeleteUrl,
  validateShorturlRes,
};
