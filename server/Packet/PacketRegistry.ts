import PacketParser from "./PacketParser";
import CSysInfoPacket from "./impl/CSysInfoPacket";
import CPingPacket from "./impl/CPingPacket";

// Register all packets
export function registerPackets() {
    PacketParser.registerPacket(1, CSysInfoPacket);
    PacketParser.registerPacket(2, CPingPacket);
}
