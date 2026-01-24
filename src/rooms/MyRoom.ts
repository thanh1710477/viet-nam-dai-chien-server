import { Room, Client, ServerError } from "colyseus";
import User, { IUser } from "../models/User";
import { MyRoomState } from "./schema/MyRoomState";

export class MyRoom extends Room {
    maxClients = 4;

    async onAuth(client: Client, options: any, request: any) {
        console.log("🔐 onAuth Check - Email:", options.email);

        if (!options.email || !options.password) {
            throw new ServerError(400, "Vui lòng nhập Email và Mật khẩu.");
        }

        const email = options.email.toLowerCase().trim();
        const user = await User.findOne({ email: email });

        if (!user) {
            console.log("❌ User not found:", email);
            throw new ServerError(401, "Email không tồn tại.");
        }

        if (user.password !== options.password) {
            console.log("❌ Wrong password for:", email);
            throw new ServerError(401, "Sai mật khẩu.");
        }

        return user;
    }

    onCreate(options: any) {
        this.setState(new MyRoomState());
        console.log("MyRoom created!", options);

        this.onMessage("type", (client, message) => {
            //
            // handle "type" message
            //
            console.log("Received message from", client.sessionId, ":", message);
            this.broadcast("message", `(${client.sessionId}) ${message}`);
        });

        this.onMessage("finish_tutorial_step", async (client, step: number) => {
            console.log(`✨ Player finished tutorial step ${step}:`, client.sessionId);

            const user = client.auth as IUser;
            if (user && user._id) {
                // Update progress only if new step is greater
                if (user.tutorialProgress < step) {
                    await User.findByIdAndUpdate(user._id, { tutorialProgress: step });
                    user.tutorialProgress = step; // Update local session user
                    console.log(`✅ Updated DB: tutorialProgress = ${step} for`, user.email);
                }
                // Always sync state to client
                if (this.state.tutorialProgress < step) {
                    this.state.tutorialProgress = step;
                }
            }
        });
    }

    onJoin(client: Client, options: any, auth: any) {
        console.log(client.sessionId, "joined!");

        // Gán thông tin người chơi mới vào state
        if (auth) {
            if (auth.isNewUser !== undefined) this.state.isNewPlayer = auth.isNewUser;
            if (auth.tutorialProgress !== undefined) this.state.tutorialProgress = auth.tutorialProgress;
        }

        this.broadcast("messages", `${client.sessionId} joined.`);
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
        this.broadcast("messages", `${client.sessionId} left.`);
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
