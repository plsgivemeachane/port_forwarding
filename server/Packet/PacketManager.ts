import { Socket } from "socket.io";
import { logger } from "../utils/winston";
import ForwardPacket from "./impl/ForwardPacket";
import Packet from "./Packet";
import PacketParser from "./PacketParser";
import Observable from "../utils/Observeable";
import Subscriber from "../utils/Subscriber";
import PortForwardingManager from "../port_fowarding/port_forwarding_manger";

export default class PacketManager {
    private sockets: Socket[] = [];
    private readySockets: Set<Socket> = new Set();
    private currentSocket: Socket | undefined;
    private observer: any = new Observable<Packet<any>>();
    private static instance: PacketManager;

    private constructor() {}

    public static getInstance(): PacketManager {
        if (!this.instance) {
            this.instance = new PacketManager();
        }
        return this.instance;
    }

    private findFreedSocket(): Socket | undefined {
        if(this.currentSocket) {
            return;
        }
        
        this.currentSocket = this.readySockets.size == 0 ? undefined : this.readySockets.values().next().value;

        if(!this.currentSocket) return;

        // Setup here
        logger.info("Setting up new server")
        this.setupDefaultListeners(this.currentSocket);
    }

    private removeSocket(socket: Socket) {
        this.sockets = this.sockets.filter((s) => s.id != socket.id);

        // Try to close all ports open by this client
        PortForwardingManager.getInstance().removeClient(socket);
    }

    public isServerReady(): boolean {
        return this.currentSocket != undefined;
    }

    private setupDefaultListeners(socket: Socket) {
        // Handle client messages
        socket.on('packet', (data) => {
            // Recived packet from client
            const packet = PacketParser.parse(data);
            this.observer.notify(packet);
            if (packet) {
                packet.handlePacket(socket);    
            }
        });

        // Handle client disconnection
        socket.on('disconnect', () => {
            logger.warn(`Client disconnected: ${socket.id}`);
            this.removeSocket(socket);
            if(this.currentSocket && this.currentSocket.id == socket.id) {
                logger.warn("Server socket closed")
                this.currentSocket = undefined;
                this.findFreedSocket(); // Try to find a new socket
            }
        });
    }

    public addSubscriber(subscriber: Subscriber) {
        this.observer.subscribe(subscriber);
    }

    public addSocket(socket: any) {
        logger.info(`Client connected: ${socket.id}`);
        this.setupDefaultListeners(socket);
        this.sockets.push(socket);
    }

    public sendPacket(client: Socket, packet: Packet<any>) {
        client.emit("packet", packet.serialize());
    }
}
