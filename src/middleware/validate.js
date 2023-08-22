const { PrismaClient, Prisma } = require("@prisma/client");
const { body, validationResult, oneOf } = require("express-validator");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const signUpValidate = [
  body("name")
    .exists()
    .withMessage("Name required")
    .bail()
    .notEmpty()
    .withMessage("Name required")
    .bail()
    .isString()
    .withMessage("Name must be string")
    .bail()
    .trim()
    .isLength({
      min: 3,
      max: 30,
    })
    .withMessage("Min 3 characters")
    .bail()
    .toLowerCase(),

  body("email")
    .exists()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Email not valid")
    .bail()
    .normalizeEmail()
    .custom(async (value) => {
      const isEmailExist = await prisma.user.findUnique({
        where: {
          email: value,
        },
      });
      if (isEmailExist) {
        throw new Error("Email already in use");
      }
    }),

  body("password")
    .exists()
    .withMessage("Password required")
    .bail()
    .notEmpty()
    .withMessage("Password empty")
    .bail()
    .isString()
    .withMessage("Password must be string")
    .bail()
    .trim()
    .isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 0,
      returnScore: false,
    })
    .withMessage("Password must contain uppercase, lowecase, and number"),

  body("birthday")
    .exists()
    .withMessage("Birthday required")
    .bail()
    .isDate({ format: "YYYY-MM-DD", strictMode: true })
    .withMessage("Birthday format YYYY-MM-DD")
    .bail()
    .toDate(),
];

const signInValidate = [
  body("email")
    .exists()
    .withMessage("Email required")
    .isEmail()
    .withMessage("Email not valid")
    .bail()
    .normalizeEmail()
    .custom(async (value) => {
      const isEmailExist = await prisma.user.findUnique({
        where: {
          email: value,
        },
      });
      if (!isEmailExist) {
        throw new Error("User  not found from validate");
      }
    }),

  body("password")
    .exists()
    .withMessage("Password required")
    .bail()
    .notEmpty()
    .withMessage("Password empty")
    .bail()
    .isString()
    .withMessage("Password must be string")
    .bail()
    .trim()
    .custom(async (value, { req }) => {
      const hashedPassword = await prisma.user.findUnique({
        where: {
          email: req.body.email,
        },
      });
      const isPassValid = bcrypt.compare(value, hashedPassword.password);
      if (!isPassValid) {
        throw new Error("Password invalid");
      }
    }),
];

const updateValidate = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("name can't empty")
    .isString()
    .withMessage("Name must be string")
    .bail()
    .isLength({
      min: 3,
      max: 30,
    })
    .withMessage("Name min 3 character adn max 30")
    .bail()
    .trim()
    .custom(async (value, { req }) => {
      if (value === req.user.name) {
        throw new Error("Name same as previous, choose different name!");
      }
    }),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Email not valid")
    .bail()
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (value === req.user.email) {
        throw new Error("Email is same as previous");
      }
      const isEmailExist = await prisma.user.findUnique({
        where: {
          email: value,
        },
      });
      if (isEmailExist) {
        throw new Error("Email already in use");
      }
    }),

  body("password")
    .optional()
    .notEmpty()
    .withMessage("Password can't be empty")
    .bail()
    .isString()
    .withMessage("Password must be string")
    .bail()
    .trim()
    .isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 0,
      returnScore: false,
    })
    .withMessage("Password must contain uppercase, lowecase, and number")
    .custom(async (value, { req }) => {
      const isPassSame = bcrypt.compareSync(value, req.user.password);
      if (isPassSame) {
        throw new Error("Password same as previous!");
      }
    }),

  body("birthday")
    .optional()
    .isDate({ format: "YYYY-MM-DD", strictMode: true })
    .withMessage("Birthday format YYYY-MM-DD")
    .bail()
    .toDate()
    .custom(async (value, { req }) => {
      if (value.getTime() === req.user.birthday.getTime()) {
        throw new Error("Birthday same as previous");
      }
    }),
];

const validateRes = async (req, res, next) => {
  const validProp = ["name", "email", "password", "birthday"];
  for (let key of Object.keys(req.body)) {
    if (!validProp.includes(key)) return res.sendStatus(400);
  }
  const checkErrors = validationResult(req);
  if (!checkErrors.isEmpty()) {
    return res.status(400).send({ errors: checkErrors.array()[0].msg });
  }
  next();
};

module.exports = {
  signUpValidate,
  signInValidate,
  updateValidate,
  validateRes,
};
