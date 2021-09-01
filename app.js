const express = require('express');
const dotenv = require('dotenv');
const ejs = require('ejs');
const { verify } = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const { isEmail } = require('validator');
const connectDB = require('./database/database');
const User = require('./model/model');
const { createToken, authRequired, checkUser } = require('./middleware/middleware');
const { genSalt, hash } = require('bcryptjs');
const app = express()

dotenv.config({ path: '.env'})
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use(checkUser)
const PORT = process.env.PORT || 8080
connectDB()

//app.get('*', checkUser )
app.get('/', authRequired, (req, res) => {
    res.render('index')
})
app.get('/register', (req, res) => {
    res.render('register')
})
app.get('/login', (req, res) => {
    res.render('login')
})
app.get('/protected', authRequired, (req, res) => {
    res.render('protected')
})
app.get('/edit', authRequired, (req, res) => {
    res.render('edit')
})
app.get('/logout', (req, res) => {
    res.cookie('jwt', '', { httpOnly: true, maxAge: 1 })
    res.redirect('/login')
})
app.get('/deleteUser', authRequired, async(req, res) => {
    const token = req.cookies.jwt
    try {
        await verify(token, process.env.ACCESS_TOKEN, async(err, decodeToken) => {
            if(err){
                console.log(err)
            }
            else{
                await User.findByIdAndDelete(decodeToken.id)
                res.cookie('jwt', '', { httpOnly: true, maxAge: 1 })
                res.redirect('/login')
            }
        })
    } catch (err) {
        res.json({ error: err.message })
    }
})
// API
app.post('/register', async(req, res) => {
    const { username, lastname, email, password } = req.body
    try {
        const user = await User.create({ username, lastname, email, password })
        res.json({ user: user })
    } catch (err) {
        console.log(err);
        const errors = handleError(err)
        res.json({error : errors})
    }
})

app.post('/login', async(req, res) => {
    const { email, password } = req.body
    try {
        const user = await User.login(email, password)
        const token = createToken(user._id)
        res.cookie('jwt', token, { httpOnly: true, expiresIn: '3d'})
        console.log('token : ', token);
        res.json({ data: user })
    } catch (err) {
        const errors = handleError(err)
        res.json({error : errors })
    }
})

app.post('/edit', authRequired, async(req, res) => { 
    const { username, lastname, email, password } = req.body
    try {
        const token = req.cookies.jwt;
        await verify(token, process.env.ACCESS_TOKEN, async(err, decodedToken) => {
            if(err){
                console.log(err);
            }
            else{
                const originUser = await User.findById(decodedToken.id)
                console.log('decodedToken.id : ', decodedToken.id);
                if((username.trim()).length > 2){
                    if((lastname.trim()).length > 2){
                        if(isEmail(email)){  
                            const valide = await User.findOne({ email })
                            if(!valide || email === originUser.email){
                                if(password.length > 6){                
                                    const salt = await genSalt()  
                                    const hashedPassword = await hash(password, salt)
                                    const user = await User.findByIdAndUpdate(decodedToken.id, {username, lastname, email, password: hashedPassword})
                                    res.json({ data: user })
                                }
                                throw Error('Minimum password length is : 7 characters')
                            }
                            throw Error('This email already token')
                        }
                        throw Error('Please enter a valide Email.')
                    }
                    throw Error('Enter your lastname.') 
                }
                throw Error('Please enter a valid name.')
            }
        })
    } 
    catch (err) {
        const errors = handleError(err.message)
        res.json({ error: errors})
    }
})

const handleError = (err) => {
    const errors = { username: '', lastname: '', email: '', password: '' };

    if(err._message === "user validation failed"){
        if(err.errors.username){
            errors.username = err.errors.username.message
        }
        if(err.errors.lastname){
            errors.lastname = err.errors.lastname.message
        }
        if(err.errors.email){
            errors.email = err.errors.email.message
        }
        if(err.errors.password){
            errors.password = err.errors.password.message
        }
    }
    if(err.code === 11000){
        errors.email = 'This email is already token. Please choose another one.'
    }

    if(err.message === 'Please enter your email.'){
        errors.email = 'Please enter your email.'
    }
    if(err.message === 'Email not found.'){
        errors.email = 'Email not found.'
    }
    if(err.message === 'Please enter the password.'){
        errors.password = 'Please enter the password.'
    }
    if(err.message === 'Incorrect password.'){
        errors.password = 'Incorrect password.'
    }

    /*------------------------------*/
    
    if(err === 'Minimum password length is : 7 characters'){
        errors.password = 'Minimum password length is : 7 characters'
    }
    if(err === 'This email already token'){
        errors.email = 'This email already token'
    }
    if(err === 'Please enter a valide Email.'){
        errors.email = 'Please enter a valide Email.'
    }
    if(err === 'Enter your lastname.'){
        errors.lastname = 'Enter your lastname.'
    }
    if(err === 'Please enter a valid name.'){
        errors.username = 'Please enter a valid name.'
    }

    return errors
}

app.listen(PORT, () => console.log(`Server is listening on port : http://localhost:${PORT}`))