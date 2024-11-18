import Packet from "../Packet";

interface PingPacketDataType {
    ping: number;
}

export default class PingPacket extends Packet<PingPacketDataType> {
    constructor() {
        super({ ping: Date.now() }, 2);
    }
}

