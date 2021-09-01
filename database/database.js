const express = require('express');
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const con = await mongoose.connect(process.env.MONGO_URI, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        })
        console.log(`mongo connect :${con.connection.host}`);
    } catch (err) {
        console.log(err.message);
    }
}

module.exports = connectDB