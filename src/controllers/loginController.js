import { Router } from 'express';

import * as userService from '../service/userService';

import usernameValidator from '../middlewares/usernameValidator';
import passwordValidator from '../middlewares/passwordValidator';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const loginController = Router();

loginController.post(
  '/',
  usernameValidator,
  passwordValidator,
  async (req, res, next) => {
    let databaseResponse = await userService.getUserByUsername(
      req.body.username
    );
    if (!databaseResponse || databaseResponse.length === 0) {
      res.status(401).send({ error: 'Invalid Username' });
    }

    let user = databaseResponse[0];

    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordCorrect) {
      res.status(401).send({ error: 'Incorrect Password' });
    }

    const token = jwt.sign(
      { username: user.username, id: user.id },
      process.env.SECRET_KEY,
      { expiresIn: '1 day' }
    );

    const updatedData = {
      id: user.id,
      lastLogin: new Date().toUTCString()
    };
    await userService.updateLastLogin(updatedData);
    databaseResponse = await userService.getUserByUsername(req.body.username);
    user = databaseResponse[0];

    res.status(200).send({
      message: 'Login Success',
      token: token,
      user: user
    });
  }
);

export default loginController;
