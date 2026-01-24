import { Schema, type } from "@colyseus/schema";

export class MyRoomState extends Schema {
    @type("boolean") isNewPlayer: boolean = false;
    @type("number") tutorialProgress: number = 0;
}
