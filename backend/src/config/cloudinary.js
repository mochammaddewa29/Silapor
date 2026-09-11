const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'yyeijl6c',
  api_key: process.env.CLOUDINARY_API_KEY || '793914174483228',
  api_secret: process.env.CLOUDINARY_API_SECRET || '2bNhnNoH8ZLTU9aiHBj_nBWCQQU',
  secure: true
});

module.exports = cloudinary;
