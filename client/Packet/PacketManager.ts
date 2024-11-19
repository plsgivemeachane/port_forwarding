import { logger } from "../utils/winston";
import PingPacket from "./impl/PingPacket";
import StatusPacket from "./impl/StatusPacket";
import type Packet from "./Packet";
import PacketParser from "./PacketParser";
import io from "socket.io-client";

export default class PacketManager {
    private SOCKET: SocketIOClient.Socket | undefined;
    private connected = false;
    private intervalId: NodeJS.Timer | undefined;
    private static instance: PacketManager;

    constructor() {}

    public static getInstance(): PacketManager {
        if (!this.instance) {
            this.instance = new PacketManager();
        }
        return this.instance;
    }

    public ping() {
        const packet = new PingPacket();
        this.sendPacket(packet);
    }

    public setup() {
        this.SOCKET = io("http://localhost:8080", {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.SOCKET.on("connect", () => {
            logger.info("Connected to server");
            this.connected = true;

            const initialPacket = new StatusPacket({
                status: "new",
                message: "Client connected",
            })

            this.sendPacket(initialPacket);

            if(this.intervalId) {
                clearInterval(this.intervalId);
            }

            // this.intervalId = setInterval(() => {
            //     this.ping();
            // }, 5000);
        });

        this.SOCKET.on("disconnect", (reason: string) => {
            logger.warn(`Disconnected from server: ${reason}`);
            this.connected = false;

            if(this.intervalId) {
                clearInterval(this.intervalId);
            }
        });

        this.SOCKET.on("connect_error", (error: any) => {
            logger.error(`Connection error: ${error.message}`);
        });

        // Handle any custom events here
        this.SOCKET.on("packet", (data: any) => {
            logger.info(`Received Packet from server: ${JSON.stringify(data)}`);
            const packet = PacketParser.parse(data);
            packet.handlePacket(this.SOCKET);
            // TODO Handleing packet recived
        });
    }

    public sendPacket(packet: Packet<any>) {
        if(!this.SOCKET || !this.connected) {
            throw new Error("Socket is not connected");
        }

        this.SOCKET.emit("packet", packet.serialize());
    }
}

