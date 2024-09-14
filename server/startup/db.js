const mongoose = require('mongoose');
const logger = require('./logging');

const mongoPassword = process.env.mongoPassword;

const uri = "mongodb+srv://jacobbowlware:" + mongoPassword + "@sponsor-db.zsf5b.mongodb.net/?retryWrites=true&w=majority&appName=sponsor-db";

console.log("TRYING TO CONNECT TO MONGO");
module.exports = () => {
    mongoose.connect(uri,)
        .then(() => console.log(`Connected to MongoDB...`))
        .catch(err => logger.error('Could not connect to MongoDB...', err));
}