const express = require('express');
const { sign, verify } = require('jsonwebtoken');
const User = require('../model/model');
 
const createToken = (id) => {
    return sign({id}, process.env.ACCESS_TOKEN, { expiresIn: '3d'})
}

const authRequired = async(req, res, next) => {
    const token = req.cookies.jwt;
    if(token){
        const valide = await verify(token, process.env.ACCESS_TOKEN, (err, decodedToken) => {
            if(err){
                res.redirect('/login')
            }
            else{
                console.log('decodedToken : ', decodedToken)
                next()
            }
        })
    }
    else{
        res.redirect('/login')
    }
}

const checkUser = async(req, res, next) => {
    const token = req.cookies.jwt;
    if(token){
        const valide = await verify(token, process.env.ACCESS_TOKEN, async(err, decodedToken) => {
            if(err){
                res.locals.user = null
            }
            else{
                const user = await User.findById(decodedToken.id)
                res.locals.user = user
                next()
            }
        })
    }
    else {
        res.locals.user = null
        next()
    }
}


module.exports = { createToken, authRequired, checkUser }