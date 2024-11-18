import { Socket } from "socket.io";
import Packet from "../Packet";
import { logger } from "../../utils/winston";

interface CPingPacketDataType {
    ping: number;
}

export default class CPingPacket extends Packet<CPingPacketDataType> {
    constructor(PACKET_DATA: CPingPacketDataType) {
        super(PACKET_DATA, 2);
    }

    public handlePacket(socket: Socket): void {
        const ping = this.getPacketData().ping;
        logger.info(`<${socket.id}> Ping: ${Date.now() - ping}ms`);
    }
}