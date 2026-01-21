import { Room, Client, ServerError } from "colyseus";
import User from "../models/User";

export class MyRoom extends Room {
    maxClients = 4;

    async onAuth(client: Client, options: any, request: any) {
        if (!options.email || !options.password) {
            throw new ServerError(400, "Vui lòng nhập Email và Mật khẩu.");
        }

        const user = await User.findOne({ email: options.email });
        if (!user) {
            throw new ServerError(401, "Email không tồn tại.");
        }

        if (user.password !== options.password) {
            throw new ServerError(401, "Sai mật khẩu.");
        }

        return true;
    }

    onCreate(options: any) {
        console.log("MyRoom created!", options);

        this.onMessage("type", (client, message) => {
            //
            // handle "type" message
            //
            console.log("Received message from", client.sessionId, ":", message);
            this.broadcast("message", `(${client.sessionId}) ${message}`);
        });
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");
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
