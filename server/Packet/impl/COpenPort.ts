import { Socket } from "socket.io";
import Packet from "../Packet";
import { logger } from "../../utils/winston";
import PortForwardingManager from "../../port_fowarding/port_forwarding_manger";

interface COpenPortPacketDataType {
    InternalPort: number;
}

export default class COpenPortPacket extends Packet<COpenPortPacketDataType> {
    constructor(PACKET_DATA: COpenPortPacketDataType) {
        super(PACKET_DATA, 5);
    }

    public handlePacket(socket: Socket): void {

        const internalPort = this.getPacketData().InternalPort;

        // Reserve a port for this client
        // TODO : Handle port reservation
        logger.info(`Reserved port for ${socket.id} : ${internalPort}`);

        // Forward the port
        PortForwardingManager.getInstance().processPort(socket, internalPort);
    }
}