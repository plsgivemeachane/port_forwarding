import Packet from "../Packet";

export interface CSysInfoPacketDataType {
    time: number,
    cpu: number,
    UsedMemory: number
    TotalMemory: number,
    UsedDisk: number,
    TotalDisk: number
    cpuUsage: number
}

export default class CSysInfoPacket extends Packet<CSysInfoPacketDataType> {

    constructor(PACKET_DATA: CSysInfoPacketDataType) {
        super(PACKET_DATA, 1);
    }
}
