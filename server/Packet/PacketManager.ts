import { Socket } from "socket.io";
import { logger } from "../utils/winston";
import ForwardPacket from "./impl/ForwardPacket";
import Packet from "./Packet";
import PacketParser from "./PacketParser";
import Observable from "../utils/Observeable";
import Subscriber from "../utils/Subscriber";

export default class PacketManager {
    private sockets: Socket[] = [];
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

    private setupListeners(socket: Socket) {
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
            if(this.currentSocket && this.currentSocket.id == socket.id) {
                this.currentSocket = undefined;
            }
        });
    }

    public addSubscriber(subscriber: Subscriber) {
        this.observer.subscribe(subscriber);
    }

    public addSocket(socket: any) {
        logger.info(`Client connected: ${socket.id}`);
        if(!this.currentSocket) {
            this.currentSocket = socket;
        }
        this.sockets.push(socket);
        this.setupListeners(socket);
    }

    public sendPacket(packet: Packet<any>) {
        if(!this.currentSocket) { 
            logger.warn("No Server connected to send packet");
            return;
        }

        this.currentSocket.emit("packet", packet.serialize());
    }
}
