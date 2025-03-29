// Import necessary modules
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cloudinary from 'cloudinary';
import multer from 'multer';
import nodemailer from 'nodemailer';

// Get directory name for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize app and load environment variables
dotenv.config();
const app = express();
const PORT = 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGO_URI = process.env.MONGO_URI;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Setup for File Uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nishithrbd@gmail.com', // Your Gmail address
    pass: 'sbosuslbbwzgyath', // Your Gmail App Password
  },
});


// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Define schemas
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['user', 'owner', 'admin'], default: 'user' },
      profilePic: { type: String } 
    });
    const User = mongoose.model('User', userSchema);

    const machineSchema = new mongoose.Schema({
      name: String,
      type: { type: String, enum: ['agriculture', 'construction', 'commercial'] },
      location: String,
      owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      isVerified: { type: Boolean, default: false },
      isAvailable: { type: Boolean, default: true },
      regNo: { type: String, unique: true },
      rentalFeePerHour: { type: Number, required: true },
      rating: { type: Number, default: 0 },
      images: [{ type: String }],
    });
    const Machine = mongoose.model('Machine', machineSchema);

    const bookingSchema = new mongoose.Schema({
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      machine: { type: mongoose.Schema.Types.ObjectId, ref: 'Machine' },
      hours: { type: Number, required: true },
      totalCost: { type: Number, required: true },
      startTime: { type: Date, required: true }, // Added for time-based booking
      endTime: { type: Date, required: true },   // Added for time-based booking
      ownerVerified: { type: String, enum: ['pending', 'yes', 'no'], default: 'pending' },
      isCancelled: { type: Boolean, default: false }
    });
    const Booking = mongoose.model('Booking', bookingSchema);

    // Authentication Middleware
    const authenticateJWT = (req, res, next) => {
      const token = req.header('Authorization');
      if (!token) return res.status(403).json({ error: 'Access denied' });
      try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = decoded;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
      }
    };

    // Register Route
    app.post('/api/auth/register', async (req, res) => {
      const { name, email, password, role } = req.body;
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, email, password: hashedPassword, role });
        res.status(201).json({ message: 'User registered successfully' });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: 'Email already exists' });
      }
    });

    // Login Route
    app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;
      try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: user.role });
      } catch (error) {
        res.status(500).json({ error: 'Login failed' });
      }
    });

    // Add Machine (Owner only)
    app.post('/api/machines', authenticateJWT, upload.array('images', 5), async (req, res) => {
      if (req.user.role !== 'owner') return res.status(403).json({ error: 'Only owners can add machines' });
      const { name, type, location, regNo, rentalFeePerHour } = req.body;
      try {
        const imageUrls = req.files ? await Promise.all(
          req.files.map(file => new Promise((resolve, reject) => {
            cloudinary.v2.uploader.upload_stream({ folder: 'machine_yard' }, (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }).end(file.buffer);
          }))
        ) : [];
        const machine = await Machine.create({
          name, type, location, regNo, rentalFeePerHour, owner: req.user.id, images: imageUrls
        });
        res.status(201).json(machine);
      } catch (error) {
        console.error('Machine registration error:', error);
        res.status(400).json({ error: 'Machine registration failed' });
      }
    });

    // Edit Machine (Owner only)
    app.put('/api/machines/:id', authenticateJWT, upload.array('images', 5), async (req, res) => {
      if (req.user.role !== 'owner') return res.status(403).json({ error: 'Access denied' });
      try {
        const machine = await Machine.findById(req.params.id);
        if (!machine || machine.owner.toString() !== req.user.id) {
          return res.status(403).json({ error: 'You can only edit your own machines' });
        }
        const updates = req.body;
        if (req.files && req.files.length > 0) {
          const imageUrls = await Promise.all(
            req.files.map(file => new Promise((resolve, reject) => {
              cloudinary.v2.uploader.upload_stream({ folder: 'machine_yard' }, (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }).end(file.buffer);
            }))
          );
          updates.images = imageUrls;
        }
        Object.assign(machine, updates);
        await machine.save();
        res.json(machine);
      } catch (error) {
        console.error('Machine update error:', error);
        res.status(500).json({ error: 'Update failed' });
      }
    });

    // Get Machine by ID
    app.get('/api/machines/:id', async (req, res) => {
      try {
        const machine = await Machine.findById(req.params.id).populate('owner', 'name').lean();
        if (!machine) return res.status(404).json({ error: 'Machine not found' });
        res.json(machine);
      } catch (error) {
        console.error('Error fetching machine:', error);
        res.status(500).json({ error: 'Failed to fetch machine' });
      }
    });

    // Verify Machine (Admin only)
    app.put('/api/machines1/verify1/:id', authenticateJWT, async (req, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can verify machines' });
      try {
        const machine = await Machine.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
        if (!machine) return res.status(404).json({ error: 'Machine not found' });
        res.json(machine);
      } catch (error) {
        console.error('Verification error:', error);
        res.status(400).json({ error: 'Verification failed' });
      }
    });

    // Rate Machine
    app.post('/api/machines/:id/rate', authenticateJWT, async (req, res) => {
      const { rating } = req.body;
      try {
        const machine = await Machine.findById(req.params.id);
        if (!machine) return res.status(404).json({ error: 'Machine not found' });
        machine.rating = (machine.rating + rating) / 2; // Simple average
        await machine.save();
        res.json(machine);
      } catch (error) {
        console.error('Rating error:', error);
        res.status(500).json({ error: 'Rating failed' });
      }
    });

    // Create Booking (User only)
    app.post('/api/bookings', authenticateJWT, async (req, res) => {
      if (req.user.role !== 'user') return res.status(403).json({ error: 'Only users can book machines' });
      const { machineId, hours, startTime } = req.body;
      try {
        const machine = await Machine.findById(machineId);
        if (!machine) return res.status(404).json({ error: 'Machine not found' });
        if (!machine.isVerified) return res.status(400).json({ error: 'Machine is not verified' });

        // Calculate start and end times
        const bookingStart = new Date(startTime || Date.now());
        const bookingEnd = new Date(bookingStart.getTime() + hours * 60 * 60 * 1000);

        // Check for overlapping bookings
        const existingBookings = await Booking.find({
          machine: machineId,
          isCancelled: false,
          $or: [
            { startTime: { $lt: bookingEnd, $gte: bookingStart } },
            { endTime: { $gt: bookingStart, $lte: bookingEnd } },
            { startTime: { $lte: bookingStart }, endTime: { $gte: bookingEnd } }
          ]
        });
        if (existingBookings.length > 0) {
          return res.status(400).json({ error: 'Machine is not available for the selected time' });
        }

        const totalCost = hours * machine.rentalFeePerHour;
        const booking = await Booking.create({
          user: req.user.id,
          machine: machineId,
          hours,
          totalCost,
          startTime: bookingStart,
          endTime: bookingEnd
        });

        // Mark machine as unavailable until booking is complete or cancelled
        machine.isAvailable = false;
        await machine.save();

        res.status(201).json(booking);
      } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Failed to create booking' });
      }
    });

    // Approve or Reject Booking (Owner only)
    app.put('/api/bookings/verify/:id', authenticateJWT, async (req, res) => {
      if (req.user.role !== 'owner') return res.status(403).json({ error: 'Only owners can verify bookings' });
      const { status } = req.body;
      try {
        const booking = await Booking.findById(req.params.id).populate('machine');
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.machine.owner.toString() !== req.user.id) {
          return res.status(403).json({ error: 'You can only verify your own machines’ bookings' });
        }
        booking.ownerVerified = status;
        await booking.save();
        if (status === 'no') {
          await Machine.findByIdAndUpdate(booking.machine._id, { isAvailable: true });
        }
        const mailOptions = {
          from: 'nishithrbd@gmail.com',
          to: 'onlynrbd@gmail.com',
          subject: `Booking ${status === 'yes' ? 'Confirmed' : 'Rejected'} for ${booking.machine.name}`,
          html: `
            <h2>Booking Update</h2>
            <p>Hello ${booking.user.name},</p>
            <p>Your booking request for <strong>${booking.machine.name}</strong> has been <strong>${status === 'yes' ? 'confirmed' : 'rejected'}</strong> by the owner.</p>
            <ul>
              <li><strong>Machine:</strong> ${booking.machine.name}</li>
              <li><strong>Start Time:</strong> ${new Date(booking.startTime).toLocaleString()}</li>
              <li><strong>End Time:</strong> ${new Date(booking.endTime).toLocaleString()}</li>
              <li><strong>Hours:</strong> ${booking.hours}</li>
              <li><strong>Total Cost:</strong> ₹${booking.totalCost.toFixed(2)}</li>
            </ul>
            ${status === 'yes' ? '<p>Thank you for using Machine Yard! Your machine is reserved.</p>' : '<p>Sorry, this booking was not approved. Please try another machine.</p>'}
            <p>Regards,<br>Machine Yard Team</p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${booking.user.email} for booking ${booking._id} - Status: ${status}`);
        res.json(booking);
      } catch (error) {
        console.error('Verification error:', error);
        res.status(400).json({ error: 'Verification failed' });
      }
    });

    // Cancel Booking (User only)
    app.put('/api/bookings/cancel/:id', authenticateJWT, async (req, res) => {
      try {
        const booking = await Booking.findById(req.params.id).populate('machine');
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        if (booking.user.toString() !== req.user.id) return res.status(403).json({ error: 'You can only cancel your own bookings' });
        if (booking.ownerVerified !== 'yes') return res.status(400).json({ error: 'Booking can only be canceled after owner verification' });
        if (booking.isCancelled) return res.status(400).json({ error: 'Booking is already cancelled' });

        booking.isCancelled = true;
        await booking.save();

        // Check if machine should be made available again
        const activeBookings = await Booking.find({
          machine: booking.machine._id,
          isCancelled: false,
          endTime: { $gt: new Date() }
        });
        if (activeBookings.length === 0) {
          await Machine.findByIdAndUpdate(booking.machine._id, { isAvailable: true });
        }

        res.json({ message: 'Booking canceled successfully' });
      } catch (error) {
        console.error('Cancellation error:', error);
        res.status(400).json({ error: 'Cancellation failed' });
      }
    });

    // Get User's Bookings
    app.get('/api/bookings/user', authenticateJWT, async (req, res) => {
      try {
        const bookings = await Booking.find({ user: req.user.id }).populate('machine');
        res.json(bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
      }
    });

    // Get Owner's Bookings
    app.get('/api/bookings/owner', authenticateJWT, async (req, res) => {
      if (req.user.role !== 'owner') return res.status(403).json({ error: 'Access denied' });
      try {
        console.log(`Fetching bookings for owner ${req.user.id}`);
        const bookings = await Booking.find({})
          .populate({
            path: 'machine',
            match: { owner: req.user.id } // Filter machines by owner
          })
          .lean();
        // Filter out bookings where machine didn't match (null after populate)
        const ownerBookings = bookings.filter(booking => booking.machine !== null);
        console.log(`Found ${ownerBookings.length} bookings for owner ${req.user.id}`);
        res.json(ownerBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
      }
    });

    // Get All Machines with Filters
    app.get('/api/machines', async (req, res) => {
      try {
        const { location, type } = req.query;
        const query = { isVerified: true, isAvailable: true }; // Only show available machines
        if (location) query.location = new RegExp(location, 'i');
        if (type) query.type = type;
        const machines = await Machine.find(query).populate('owner', 'name');
        res.json(machines);
      } catch (error) {
        console.error('Error fetching machines:', error);
        res.status(500).json({ error: 'Failed to fetch machines' });
      }
    });

    app.get('/api/owners1/:ownerId', authenticateJWT, async (req, res) => {
      // console.log('first')
      try {
          const owner = await User.findById(req.params.ownerId).select('name'); // Assuming `User` is your owner model
          const email = await User.findById(req.params.ownerId).select('email'); // Assuming `User` is your owner model
          if (!owner || !email) return res.status(404).json({ error: 'Owner not found' });
  
          res.json({owner, email});
      } catch (error) {
          console.error('Error fetching owner details:', error);
          res.status(500).json({ error: 'Failed to fetch owner details' });
      }
  });
  

    // Get Owner's Machines
    app.get('/api/machines1/owner1', authenticateJWT, async (req, res) => {
      if (req.user.role !== 'owner') return res.status(403).json({ error: 'Access denied' });
      try {
        const machines = await Machine.find({ owner: req.user.id }).lean();
        res.json(machines);
      } catch (error) {
        console.error('Error fetching machines:', error);
        res.status(500).json({ error: 'Failed to fetch machines' });
      }
    });

    // Get Pending Machines (Admin only)
    app.get('/api/machines1/pending1', authenticateJWT, async (req, res) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
      try {
        const machines = await Machine.find({ isVerified: false }).populate('owner', 'name');
        res.json(machines);
      } catch (error) {
        console.error('Error fetching machines:', error);
        res.status(500).json({ error: 'Failed to fetch machines' });
      }
    });

    // Delete Machine (Owner only)
    app.delete('/api/machines/:id', authenticateJWT, async (req, res) => {
      if (req.user.role !== 'owner') return res.status(403).json({ error: 'Access denied' });
      try {
        const machine = await Machine.findById(req.params.id);
        if (!machine) return res.status(404).json({ error: 'Machine not found' });
        if (machine.owner.toString() !== req.user.id) {
          return res.status(403).json({ error: 'You can only delete your own machines' });
        }
        await machine.deleteOne();
        res.json({ message: 'Machine deleted successfully' });
      } catch (error) {
        console.error('Error deleting machine:', error);
        res.status(500).json({ error: 'Failed to delete machine' });
      }
    });

    // GET Profile
app.get('/api/auth/profile', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT Profile (Handles both name/email updates and profile picture upload)
app.put('/api/auth/profile', authenticateJWT, upload.single('profilePic'), async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) {
      const emailExists = await User.findOne({ email: req.body.email, _id: { $ne: req.user.id } });
      if (emailExists) return res.status(400).json({ error: 'Email already in use' });
      updates.email = req.body.email;
    }
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({ folder: 'machine_yard_profiles' }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(req.file.buffer);
      });
      updates.profilePic = result.secure_url;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
    // Static files AFTER API routes
    app.use(express.static(join(__dirname, 'public')));

    // Start server
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(error => console.log('MongoDB connection error:', error));