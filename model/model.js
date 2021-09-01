const express = require('express');
const mongoose = require('mongoose');
const { isEmail } = require('validator');
const { hash, genSalt, compare } = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'please enter your name.'],
        trim: true
    },
    lastname: {
        type: String,
        required: [true, 'Please enter your lastname.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please enter an email.'],
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valide email.']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password.'],
        minlength: [7, 'Minimum length is 7 characters.'],
        trim: true
    }
})

userSchema.pre('save', async function(){
    const salt = await genSalt()
    this.password = await hash(this.password, salt)
})

userSchema.statics.login = async function(email, password) {
    if(email){
        const user = await this.findOne({ email })
        if(user){
            if(password){
                const valide = await compare(password, user.password)
                if(valide){
                    return user
                }
                throw Error('Incorrect password.')
            }
            throw Error('Please enter the password.')
        }
        throw Error('Email not found.')
    }
    throw Error('Please enter your email.')
}

const User = mongoose.model('user', userSchema)

module.exports = User