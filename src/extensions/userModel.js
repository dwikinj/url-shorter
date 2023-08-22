const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env" });
const prisma = new PrismaClient();

const xprisma = prisma.$extends({
  name: "custom user method",
  model: {
    user: {
      async signUp(user) {
        try {
          const { name, email, password, birthday } = user;
          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(password, salt);
          const newUser = await prisma.user.create({
            data: {
              name,
              email,
              password: hash,
              birthday,
            },
            select: {
              name: true,
              email: true,
              birthday: true,
            },
          });
          return newUser;
        } catch (e) {
          return null;
        }
      },
      async signIn(data) {
        try {
          const { email, password } = data;
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
            include: {
              token: true,
            },
          });

          let hasValidToken = false;
          let userToken = null;

          if (user) {
            if (user.token.length > 0) {
              for (let i = 0; i < user.token.length; i++) {
                const currentToken = user.token[i];
                console.log(currentToken)
                try {
                  const decoded = jwt.verify(
                    currentToken.token,
                    process.env.ACCESS_TOKEN_SECRET
                  );

                  const isPassValid = bcrypt.compareSync(
                    decoded.password,
                    user.password
                  );
                  if (!isPassValid) {
                    await prisma.token.delete({
                      where: {
                        id: currentToken.id,
                      },
                    });
                  } else {
                    hasValidToken = true;
                  }
                } catch (error) {
                  await prisma.token.delete({
                    where: {
                      id: currentToken.id,
                    },
                  });
                }
              }
            }
            if (!hasValidToken) {
              const newToken = jwt.sign(
                { email: user.email, password: user.password },
                process.env.ACCESS_TOKEN_SECRET,
                {
                  expiresIn: "3d",
                }
              );
              userToken = await prisma.token.create({
                data: {
                  user: {
                    connect: { id: user.id },
                  },
                  token: newToken,
                  expiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                },
              });
            }
          }

          return userToken;
        } catch (error) {
          throw new Error("User not found");
        }
      },
      async updateUser(req){
        try {
          // console.log(data)
          const {name="",email="",password="", birthday=""} = req.body

          const updatedProp = {}
          if (name) updatedProp.name= name;
          if (email) updatedProp.email = email;
          if (password) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            updatedProp.password = hash;
          };
          if (birthday) updatedProp.birthday = birthday;
          console.log(updatedProp)
          const userUpdate = await prisma.user.update({
            where:{
              id: req.user.id
            },
            data: updatedProp
          })
          return userUpdate

        } catch (error) {
          return null
        }

      }
    },
  },
});

module.exports = {
  xprisma,
};
