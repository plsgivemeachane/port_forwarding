import PingPacket from "./impl/PingPacket";
import SForwardPacket from "./impl/SForwardPacket";
import StatusPacket from "./impl/StatusPacket";
import SysInfoPacket from "./impl/SysInfoPacket";
import type { RawPacket } from "./Packet";

const PACKET_ID_MAP = {
    1: SysInfoPacket,
    2: PingPacket,
    3: SForwardPacket,
    4: StatusPacket
} as const;

type PacketId = keyof typeof PACKET_ID_MAP;

export default class PacketParser {
    public static parse(rawPacket: RawPacket): any {
        const packetId = rawPacket.PACKET_ID as PacketId;
        
        if (packetId in PACKET_ID_MAP) {
            const PacketClass = PACKET_ID_MAP[packetId];
            return new PacketClass(rawPacket.PACKET_DATA as any);
        }
        
        throw new Error(`Unknown packet ID: ${packetId}`);
    }
}
