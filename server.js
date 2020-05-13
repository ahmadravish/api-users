const express = require('express');
const connectDB = require('./configDB/db');

const app = express();

//connect DataBase
connectDB();

//middleware
app.use(express.json({ extended: false })); //use to post request in json inchild routes

app.get('/', (req, res) => res.send('API Running'));

//Routes
//use middleware app.use() which run on every req corespond to link in 1st parameter
//this route is parent route and its children routes are in file path in 2nd parameter
app.use('/api/users', require('./routes/api/users'));

const PORT = process.env.port || 5000;

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
