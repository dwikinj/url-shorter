const express = require("express");
require("dotenv").config({path: "./.env"})
const app = express()
const PORT = process.env.PORT || 3000
const UserRouter = require("./routes/user")
const ShorturlRouter = require("./routes/shortUrl")


app.use(express.json())

app.use(UserRouter);
app.use(ShorturlRouter)

app.listen(PORT, () => {
    console.log(`Server running at PORT ${PORT}`);
})