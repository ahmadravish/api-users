//this route is for register new user

const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator'); //for check

const User = require('../../models/User'); //get userschema or model

//get jwt secret token from config
const config = require('config');
const jwtSecret = config.get('jwtSecret');
router.post(
  '/',
  [
    //check is inbuit express fun to check various values
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please write an valid email').isEmail(),
    check('password', 'password shoud more than 6 characters').isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req); //take errors from check

    if (!errors.isEmpty()) {
      //if there are errors in check
      return res.status(400).json({ errors: errors.array() }); //400->bad request
    }

    const { name, email, password } = req.body; //destructure from userschema or model

    try {
      //check if user already exist
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exist' }] }); //make errors same as check
      }

      //get users gravatar
      const avatar = gravatar.url(email, {
        s: '200', //size
        r: 'pg',
        d: 'mm', //default
      });
      user = new User({ name, email, avatar, password }); //create instance to save in db use .save()

      //encrypt password
      //{note:whenever an func inbuilt or userdefine get a promise/value from func. use await}
      const salt = await bcrypt.genSalt(10); //random text to encrypt pass
      user.password = await bcrypt.hash(password, salt);

      await user.save(); //save evrything(email,pass,name..) in db

      //check jwt valid or not
      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(payload, jwtSecret, { expiresIn: 360000 }, (err, token) => {
        //check token after every expire for security
        if (err) throw err;
        res.json({ token });
      });

      // res.send(req.body);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('server error');
    }
  }
);

//route: GET api/users;
//get all profiles
//acess:  Public
router.get('/', async (req, res) => {
  try {
    const profiles = await User.find().populate('user', ['name', 'avatar']);
    //populate is use to add name and avatar from user schema
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//route: GET api/users/id
//get profile by user ID
//acess:  Public
router.get('/:user_id', async (req, res) => {
  try {
    const profile = await User.findOne({
      _id: req.params.user_id,
    }); //populate is use to add name and avatar from user schema

    if (!profile) return res.status(400).json({ msg: 'profile not found' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      //if there is user id which doesn't exist
      //in absence of this,it shows server error if user id doesnt exist
      return res.status(400).json({ msg: 'No profile found' });
    }
    res.status(500).send('Server Error');
  }
});

//route: PUT api/users/id
//edit profile by user ID
//acess:  Public
router.put(
  '/:user_id',

  [
    //when both  middleware and check is use
    check('name', 'username is required').not().isEmpty(),
    check('password', 'password is required').not().isEmpty(),
    check('email', 'email is required').not().isEmpty(),
  ],

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;

    const salt = await bcrypt.genSalt(10); //random text to encrypt pass
    newpassword = await bcrypt.hash(password, salt);

    try {
      let profile = await User.findOne({ _id: req.params.user_id });
      if (profile) {
        //if exist
        //update
        await User.findOneAndUpdate(
          { _id: req.params.user_id },
          { $set: { name: name, password: newpassword, email: email } },
          { new: true },
          (err, doc) => {
            if (err) {
              console.log('Something wrong when updating data!');
            }
            return res.json(doc);
          }
        );
      } else {
        return res.status(400).json({ msg: 'No profile found' });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//route: DELETE api/users/id
//delete profile,user & post by user ID
//acess:  Private
router.delete('/:user_id', async (req, res) => {
  try {
    //Remove User
    await User.findOneAndRemove({ _id: req.params.user_id });

    res.json({ msg: 'User Removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
module.exports = router;
