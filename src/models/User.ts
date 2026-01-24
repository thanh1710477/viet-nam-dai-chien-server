import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    email: string;
    password: string;
    isNewUser: boolean;
    tutorialProgress: number;
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isNewUser: { type: Boolean, default: true },
    tutorialProgress: { type: Number, default: 0 }
});

export default mongoose.model<IUser>("User", UserSchema);
