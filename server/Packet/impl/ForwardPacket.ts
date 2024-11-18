import type internal from "stream";
import Packet from "../Packet";
import { Socket } from "socket.io";

interface ForwardPacketDataType {
    hostname: string,
    externalPort: number,
    internalPort: number
}

export default class ForwardPacket extends Packet<ForwardPacketDataType> {
    constructor(data: ForwardPacketDataType) {
        super(data, 3);
    }
}