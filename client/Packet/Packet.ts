import SysInfoPacket from "./impl/SysInfoPacket";
import io from "socket.io-client";
import { logger } from "../utils/winston";
import PingPacket from "./impl/PingPacket";


export interface RawPacket {
    PACKET_ID: number;
    PACKET_DATA: any;
}

export default class Packet<T extends object> {
    private readonly PACKET_ID: number;
    private readonly PACKET_DATA: T;

    constructor(PACKET_DATA: T, PACKET_ID: number) {
        this.PACKET_ID = PACKET_ID;
        this.PACKET_DATA = PACKET_DATA;
    }

    public getPacketId() {
        return this.PACKET_ID;
    }

    public getPacketData<T>() {
        return this.PACKET_DATA;
    }

    public debugPacket() {
        logger.info(`Packet ID: ${this.PACKET_ID}`);
        logger.info(`Packet Data: ${JSON.stringify(this.PACKET_DATA)}`);
    }

    public serialize() {
        return {
            PACKET_ID: this.PACKET_ID,
            PACKET_DATA: this.PACKET_DATA,
        };
    }

    public handlePacket(socket: SocketIOClient.Socket) {
        throw new Error("Method not implemented.");
    }
}
