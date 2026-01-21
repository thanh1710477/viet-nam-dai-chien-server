import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { RedisPresence } from "@colyseus/redis-presence";
import { MongooseDriver } from "@colyseus/mongoose-driver";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { MyRoom } from "./rooms/MyRoom";
import User from "./models/User";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

// Connection logging
mongoose.connection.on("connected", () => console.log("✅ MongoDB Connected Successfully!"));
mongoose.connection.on("error", (err) => console.error("❌ MongoDB Connection Error:", err));
mongoose.connection.on("disconnected", () => console.log("⚠️ MongoDB Disconnected"));

// Explicitly connect to MongoDB
const mongoUri = (process.env.MONGO_URI || "mongodb://localhost:27017/colyseus_cloud").trim();
console.log(`📡 Connecting to MongoDB... (URI prefix: ${mongoUri.substring(0, 15)}... , Length: ${mongoUri.length})`);

mongoose.connect(mongoUri, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
}).then(() => {
    console.log("🚀 Mongoose connected explicitly!");
}).catch(err => {
    console.error("❌ Mongoose explicit connection failed:", err);
});

// Disable buffering to fail fast if connection is not ready
mongoose.set('bufferCommands', false);

const port = Number(process.env.PORT || 2567);
const app = express();

// Mail Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter on startup
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Email Transporter Error:", error);
    } else {
        console.log("🚀 Email Server is ready to send messages");
    }
});

app.use(cors());
app.use(express.json());

// API Routes
app.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Thiếu email hoặc mật khẩu." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email đã tồn tại." });
        }

        const newUser = new User({ email, password });
        await newUser.save();

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Lỗi Server." });
    }
});

app.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "Email không tồn tại." });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: '[Việt Nam Đại Chiến] Khôi phục mật khẩu',
            text: `Xin chào,\n\nBạn đã yêu cầu khôi phục mật khẩu.\nMật khẩu của bạn là: ${user.password}\n\nVui lòng đổi mật khẩu sau khi đăng nhập thành công.\n\nTrân trọng,\nĐội ngũ Việt Nam Đại Chiến.`
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email đã được gửi tới: ${email}`);

        res.json({ success: true, message: "Đã gửi email khôi phục mật khẩu." });
    } catch (e) {
        console.error("❌ Lỗi gửi email:", e);
        res.status(500).json({ error: "Lỗi Server khi gửi email." });
    }
});

// Create HTTP server
const gameServer = new Server({
    server: createServer(app),
    // Use Redis for presence if configured, otherwise default to LocalPresence (in-memory)
    presence: process.env.REDIS_URL ? new RedisPresence({
        url: process.env.REDIS_URL,
    } as any) : undefined,
    // Use MongoDB for driver (persistence)
    driver: new MongooseDriver(mongoUri),
});

// Register Room handlers
gameServer.define("my_room", MyRoom);

// Register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
