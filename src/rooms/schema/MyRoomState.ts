import { Schema, type } from "@colyseus/schema";

export class MyRoomState extends Schema {
    @type("boolean") isNewPlayer: boolean = false;
}
