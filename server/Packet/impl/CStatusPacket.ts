import { Socket } from "socket.io";
import Packet from "../Packet";
import PacketManager from "../PacketManager";

export interface CStatusPacketDataType {
    status: "new" | "set" | "work",
    message?: string 
}

export default class CStatusPacket extends Packet<CStatusPacketDataType> {
    constructor(data: CStatusPacketDataType) {
        super(data, 4);
    }

    handlePacket(socket: Socket) {

    }
}