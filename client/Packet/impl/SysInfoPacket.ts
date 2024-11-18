import Packet from "../Packet"

export interface SysInfoPacketDataType {
    time: number,
    cpu: number,
    UsedMemory: number
    TotalMemory: number,
    UsedDisk: number,
    TotalDisk: number
    cpuUsage: number
}

export default class SysInfoPacket extends Packet<SysInfoPacketDataType> {

    constructor(PACKET_DATA: SysInfoPacketDataType) {
        super(PACKET_DATA, 1);
    }
}