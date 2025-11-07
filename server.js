import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB database
connectDB();

const PORT = process.env.PORT || 5001; 

app.listen(PORT, () => {
  console.log(`Pharmacy server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`http://localhost:${PORT}`)

});