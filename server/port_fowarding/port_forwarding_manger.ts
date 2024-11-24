import ForwardPacket from "../Packet/impl/ForwardPacket";
import { Socket } from "socket.io";
import PacketManager from "../Packet/PacketManager";
import { logger } from "../utils/winston";
import net from 'net'
import dotenv from 'dotenv'
import dns from 'dns/promises'
import ServerPortPacket from "../Packet/impl/ServerPortPacket";

dotenv.config()

const BASEPORT = process.env.BASEPORT ? parseInt(process.env.BASEPORT) : 10000
const INTERNALPORT = process.env.INTERNALPORT ? parseInt(process.env.INTERNALPORT) : 8000
const LISTENPORT = process.env.LISTENPORT ? parseInt(process.env.LISTENPORT) : 8001
const SERVERHOSTNAME = process.env.SERVERHOSTNAME || "localhost"

export default class PortForwardingManager {
    private static instance: PortForwardingManager;
    private usagePort: number[] = []
    private listenersMap: Map<number, [net.Server, number]> = new Map()
    private clients: Set<[string, number]> = new Set();

    private constructor() { 
        logger.info("Server setup:")
        logger.info(`Base port: ${BASEPORT}`)
        logger.info(`Server hostname: ${SERVERHOSTNAME}`)
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new PortForwardingManager();
        }
        return this.instance;
    }

    private getFreePort() {
        let port = BASEPORT
        while (this.usagePort.includes(port)) {
            port++
        }
        this.usagePort.push(port)
        return port
    }

    private clearPort(port: number) {
        this.usagePort = this.usagePort.filter(p => p !== port);
        this.listenersMap.delete(port);
    }

    private hasClient(socketId: string, internalPort: number): boolean {
        for (const [existingSocketId, existingPort] of this.clients) {
            if (existingSocketId === socketId && existingPort === internalPort) {
                return true;
            }
        }
        return false;
    }

    public removeClient(socket: Socket) {
        // Find all ports open by this client
        const ports = Array.from(this.clients).filter(([key, _]) => key === socket.id)
        // Close all ports
        ports.forEach(([key, value]) => {
            logger.info(`[Tunnel] Closing port ${value} for client ${key}`)
            this.clearListeningPort(value)
            this.clients.delete([key, value])
        })
    }

    private clearListeningPort(port: number) {
        const val = this.listenersMap.get(port)
        if(!val) return;
        const [server, occupiedPort] = val
        server.close(() => {
            logger.info(`[Tunnel] Closed port ${occupiedPort}`)
        })
        // Free the port
        this.clearPort(occupiedPort)
    }

    public async processPort(socket: Socket, internalPort: number) {
        if(this.hasClient(socket.id, internalPort)) {
            // Already opend port for this client with this socket
            logger.info(`[Tunnel] Already opend port for this client with this socket`);
            return
        }

        const freePort = this.getFreePort()

        this.clients.add([socket.id, internalPort])

        // Notify the client
        const packet = new ServerPortPacket({
            externalPort: freePort,
            fullUrl: `http://${SERVERHOSTNAME}:${freePort}`
        })

        PacketManager.getInstance().sendPacket(socket, packet);

        logger.info(`[Tunnel] Port allocated for connection: ${freePort}`);
        const server = net.createServer((clientSocket) => {
            logger.info(`[Tunnel] Recived connection from ${clientSocket.remoteAddress}`);

            const allowedPort = this.getFreePort()
            logger.info(`[Tunnel] Port allocated: ${allowedPort}`);
            // Then create server for that port
            let tcpSocket = net.createServer((forwardSocket) => {
                logger.info(`[Tunnel] Connection established on port ${allowedPort}`);
                forwardSocket.setKeepAlive(true);
                // clientSocket.setKeepAlive(true);
                forwardSocket.setTimeout(0);
                // clientSocket.setTimeout(0);

                // Piping
                forwardSocket.pipe(clientSocket, { end: false });
                clientSocket.pipe(forwardSocket, { end: true });

                clientSocket.on('end', () => {
                    forwardSocket.end();
                    logger.info(`[Tunnel] Client socket ended`);
                });

                // Handle errors
                forwardSocket.on('error', (error) => {
                    logger.error(`[Tunnel] Forward socket error: ${error.message}`);
                    clientSocket.end();
                });

                // Handle Closure
                clientSocket.on('error', (error) => {
                    logger.error(`[Tunnel] Client socket error: ${error.message}`);
                    forwardSocket.end();
                });
            });

            tcpSocket.listen(allowedPort, () => {
                logger.info(`[Tunnel] Tunnel server listening on port ${allowedPort}`);
            });

            tcpSocket.on('error', (error) => {
                logger.error(`[Tunnel] TCP Server error: ${error.message}`);
                this.clearPort(allowedPort);
            });

            // Cleanup when the initial connection closes
            clientSocket.on('close', () => {
                logger.info(`[Tunnel] Client connection closed`);
                this.clearPort(allowedPort);
                tcpSocket.close();
            });

            // Send the packet to request the client
            const portPacket = new ForwardPacket({
                hostname: SERVERHOSTNAME,
                externalPort: allowedPort,
                internalPort: internalPort
            });
            
            PacketManager.getInstance().sendPacket(socket, portPacket);
        })

        server.listen(freePort, () => {
            logger.info(`Forwarding listening on port ${freePort}`);
        });

        this.listenersMap.set(internalPort, [server, freePort]);
    }
}