require('dotenv').config();
const mongoose = require('mongoose');
const db = require('../config/mongoose-connection');
const userModel = require('../models/user-model');

async function createAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error('Error: Email argument missing.');
        console.error('Usage: node scripts/createAdmin.js <user-email>');
        process.exit(1);
    }

    try {
        if (mongoose.connection.readyState !== 1) {
            await new Promise((resolve, reject) => {
                mongoose.connection.once('open', resolve);
                mongoose.connection.once('error', reject);
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            console.error(`Error: User with email "${email}" not found.`);
            process.exit(1);
        }

        user.role = 'admin';
        await user.save();

        console.log(`Success: User "${email}" has been granted admin role.`);
        process.exit(0);
    } catch (err) {
        console.error(`Failed to update user to admin: ${err.message}`);
        process.exit(1);
    }
}

createAdmin();
