const express = require("express");
const cors = require("cors"); 
const dotenv = require("dotenv").config();
const connectDb = require("./lib/dbConnection")
const errorHandler = require("./middleware/errorHandler")


connectDb();

const app = express();

const port = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json());
app.use("/api/users" , require("./routes/userRoutes"))
app.use("/api/students" , require("./routes/studentRoutes"))
app.use(errorHandler)
app.listen(port, ()=>{
    console.log(`server running on port ${port}`)
})