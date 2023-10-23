const mongoose = require('mongoose')
const dotenv = require('dotenv')
const port = 3000;
const app = require('./app');

dotenv.config({path: './config.env'})

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

console.log("It's about to go down")
console.log(process.env.NODE_ENV)

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
