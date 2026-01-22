import { Room, Client, ServerError } from "colyseus";
import User, { IUser } from "../models/User";
import { MyRoomState } from "./schema/MyRoomState";

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
    }

    onJoin(client: Client, options: any, auth: any) {
        console.log(client.sessionId, "joined!");

        // Gán thông tin người chơi mới vào state
        if (auth && auth.isNewUser !== undefined) {
            this.state.isNewPlayer = auth.isNewUser;
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
