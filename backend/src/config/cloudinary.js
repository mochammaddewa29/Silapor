const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'esyotjeb',
  api_key: process.env.CLOUDINARY_API_KEY || '229679954961957',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'bOjxAwqpOxqn0qXdN4mahH-aXuY',
  secure: true
});

module.exports = cloudinary;
