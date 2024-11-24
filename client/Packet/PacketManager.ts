import { logger } from "../utils/winston";
import PingPacket from "./impl/PingPacket";
import StatusPacket from "./impl/StatusPacket";
import type Packet from "./Packet";
import PacketParser from "./PacketParser";
import io from "socket.io-client";
// import dotenv from 'dotenv';

// Load environment variables
// dotenv.config();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8080';
const RECONNECT_ATTEMPTS = process.env.SOCKET_RECONNECT_ATTEMPTS ? parseInt(process.env.SOCKET_RECONNECT_ATTEMPTS) : 10;
const RECONNECT_DELAY = process.env.SOCKET_RECONNECT_DELAY ? parseInt(process.env.SOCKET_RECONNECT_DELAY) : 2000;

export default class PacketManager {
    private SOCKET: SocketIOClient.Socket | undefined;
    private connected = false;
    private intervalId: number | undefined;
    private static instance: PacketManager;
    private reconnectAttempts = 0;

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

    public async waitForConnection() {
        while (!this.connected) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    public setup() {
        this.SOCKET = io(SERVER_URL, {
            reconnection: true,
            reconnectionAttempts: RECONNECT_ATTEMPTS,
            reconnectionDelay: RECONNECT_DELAY,
            timeout: 10000
        });

        this.SOCKET.on("connect", () => {
            logger.info(`Connected to server at ${SERVER_URL}`);
            this.connected = true;
            this.reconnectAttempts = 0;

            const initialPacket = new StatusPacket({
                status: "new",
                message: "Client connected",
            })

            this.sendPacket(initialPacket);

            if(this.intervalId) {
                clearInterval(this.intervalId);
            }

            // Setup ping interval
            // this.intervalId = setInterval(() => {
            //     this.ping();
            // }, 30000); // Ping every 30 seconds
        });

        this.SOCKET.on("disconnect", (reason: string) => {
            logger.warn(`Disconnected from server: ${reason}`);
            this.connected = false;

            if(this.intervalId) {
                clearInterval(this.intervalId);
            }

            // Try to reconnect if max attempts not reached
            if (this.reconnectAttempts < RECONNECT_ATTEMPTS) {
                this.reconnectAttempts++;
                logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${RECONNECT_ATTEMPTS})`);
                setTimeout(() => {
                    if (!this.connected) {
                        this.setup();
                    }
                }, RECONNECT_DELAY);
            }
        });

        this.SOCKET.on("connect_error", (error: any) => {
            logger.error(`Connection error: ${error.message}`);
        });

        // Handle any custom events here
        this.SOCKET.on("packet", (data: any) => {
            logger.info(`Received Packet from server: ${JSON.stringify(data)}`);
            const packet = PacketParser.parse(data);
            if (packet) {
                try {
                    packet.handlePacket(this.SOCKET);
                } catch (error) {
                    logger.error(`Error handling packet: ${error}`);
                }
            }
        });
    }

    public sendPacket(packet: Packet<any>) {
        if(!this.SOCKET || !this.connected) {
            throw new Error("Socket is not connected");
        }

        try {
            this.SOCKET.emit("packet", packet.serialize());
        } catch (error) {
            logger.error(`Error sending packet: ${error}`);
            throw error;
        }
    }
}
