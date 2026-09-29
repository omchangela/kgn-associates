import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    first_name: {
      type: String,
      default: '',
      trim: true,
    },
    last_name: {
      type: String,
      default: '',
      trim: true,
    },
    phone_number: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'valuer', 'staff'],
      default: 'valuer',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model overwrite during Next.js hot reload
export default mongoose.models.User || mongoose.model('User', UserSchema);
