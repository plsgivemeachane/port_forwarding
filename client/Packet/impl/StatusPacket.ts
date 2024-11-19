import Packet from "../Packet";

export interface StatusPacketDataType {
    status: "new" | "set" | "work",
    message?: string 
}

export default class StatusPacket extends Packet<StatusPacketDataType> {
    constructor(data: StatusPacketDataType) {
        super(data, 4);
    }
}