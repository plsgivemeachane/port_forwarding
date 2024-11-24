import Packet from "../Packet";
import { logger } from "../../utils/winston";

interface ServerPortPacketDataType {
    externalPort: number;
    fullUrl: string

}

export default class SPortPacket extends Packet<ServerPortPacketDataType> {
    constructor(PACKET_DATA: ServerPortPacketDataType) {
        super(PACKET_DATA, 6);
    }

    public handlePacket(socket: SocketIOClient.Socket) {
        // Just log the packet
        logger.info(`Server processed port : ${this.getPacketData().externalPort}`);
        logger.info(`Full path: ${this.getPacketData().fullUrl}`);
    }

}