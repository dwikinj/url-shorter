const { PrismaClient } = require("@prisma/client");
const { customAlphabet } = require("nanoid");
require("dotenv").config({ path: ".env" });
const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 6);
const prisma = new PrismaClient();

const xprismaShorturl = prisma.$extends({
  name: "Shorturl Custom Method",
  model: {
    shorturl: {
      async createShort(reqUser, reqBody) {
        try {
          const shorturl = await prisma.shorturl.create({
            data: {
              originalUrl: reqBody.url,
              paramsUrl: reqBody.customUrl ? reqBody.customUrl : nanoid(),
              userId: reqUser.id,
            },
          });
          if (!shorturl) return null;
          return shorturl;
        } catch (error) {
          console.log(error);
          return null;
        }
      },
      async updateShorturl(param, reqBody) {
        try {
        
          const updateCustomurl = await prisma.shorturl.update({
            where: {
              paramsUrl: param,
            }, 
            data:{
                paramsUrl: reqBody.customUrl
            }
          });
          if (!updateCustomurl) return res.status(400).send({error: "Failed to update"})
          return updateCustomurl
        } catch (e) {
          return res.sendStatus(404);
        }
      },
      async deleteShorturl(param){
       try {
        const delShorturl = await prisma.shorturl.delete({
            where:{
                paramsUrl: param
            },
            select:{
                id: true,
                originalUrl: true,
                paramsUrl:true,
                userId: true
            }
        })
        if(delShorturl) return {"Succes delete": delShorturl}
       } catch (error) {
        return null
        
        
       }

      }
    },
  },
});

module.exports = xprismaShorturl;
