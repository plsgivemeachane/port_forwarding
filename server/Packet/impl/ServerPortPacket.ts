import { Socket } from "socket.io";
import Packet from "../Packet";
import { logger } from "../../utils/winston";
import PortForwardingManager from "../../port_fowarding/port_forwarding_manger";

interface ServerPortPacketDataType {
    externalPort: number;
    fullUrl: string
}

export default class ServerPortPacket extends Packet<ServerPortPacketDataType> {
    constructor(PACKET_DATA: ServerPortPacketDataType) {
        super(PACKET_DATA, 6);
    }
}