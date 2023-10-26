const mongoose = require('mongoose')
const dotenv = require('dotenv')
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
    dbName: 'RoomService'
    // useCreateIndex: true,
    // useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

app.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.PORT}`);
});
