import { logger } from "../utils/winston";
import { RawPacket } from "./Packet";

export default class PacketParser {
    private static packetMap = new Map<number, any>();

    public static registerPacket(id: number, packetClass: any) {
        logger.info(`Registered packet id: ${id}`);
        this.packetMap.set(id, packetClass);
    }

    public static parse(rawPacket: RawPacket): any {
        const packetClass = this.packetMap.get(rawPacket.PACKET_ID);
        
        if (packetClass) {
            return new packetClass(rawPacket.PACKET_DATA);
        }
        
        logger.error(`Unknown packet id: ${rawPacket.PACKET_ID}`);
        return null;
    }
}