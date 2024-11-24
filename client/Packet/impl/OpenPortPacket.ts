import Packet from "../Packet";

interface OpenPortPacketDataType {
    InternalPort: number;
}

// Send packet
export default class OpenPortPacket extends Packet<OpenPortPacketDataType> {
    constructor(internalPort: number) {
        super({ InternalPort: internalPort }, 5);
    }
}

