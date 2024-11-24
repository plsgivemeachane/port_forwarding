import PacketParser from "./PacketParser";
import CSysInfoPacket from "./impl/CSysInfoPacket";
import CPingPacket from "./impl/CPingPacket";
import CStatusPacket from "./impl/CStatusPacket";
import COpenPortPacket from "./impl/COpenPort";

// Register all packets
export function registerPackets() {
    PacketParser.registerPacket(1, CSysInfoPacket);
    PacketParser.registerPacket(2, CPingPacket);
    PacketParser.registerPacket(4, CStatusPacket);
    PacketParser.registerPacket(5, COpenPortPacket);
    
}
