import type internal from "stream";
import Packet from "../Packet";
import { logger } from "../../utils/winston";
import PortForwarding from "../../port_forwarding/PortForwarding";

interface SForwardPacketDataType {
    hostname: string,
    externalPort: number,
    internalPort: number
}

export default class SForwardPacket extends Packet<SForwardPacketDataType> {
    constructor(data: SForwardPacketDataType) {
        super(data, 3);
    }

    public handlePacket(): void {
        logger.info(`Forwarding port ${this.getPacketData().externalPort} to ${this.getPacketData().hostname}:${this.getPacketData().internalPort}`);
        PortForwarding.getInstance().forward(this.getPacketData().externalPort, this.getPacketData().internalPort, this.getPacketData().hostname);
    }
}