// db.js
const mongoose = require('mongoose');

function connect() {
  const mongoURI = 'mongodb://localhost:27017/mydatabase'; // Replace with your MongoDB connection URL

  mongoose
    .connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4 // By setting family: 4, you explicitly instruct the MongoDB client to use IPv4,which can help overcome any potential issues related to IPv6 connectivity.
    })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
    });
}

module.exports = { connect };
