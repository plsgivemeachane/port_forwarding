import ForwardPacket from "../Packet/impl/ForwardPacket";
import PacketManager from "../Packet/PacketManager";
import { logger } from "../utils/winston";
import net from 'net'

const BASEPORT = 10000
const INTERNALPORT = 25565
const LISTENPORT = 8001

export default class PortForwardingManager {
    private static instance: PortForwardingManager;
    private usagePort: number[] = []
    private listenersMap: Map<number, net.Server> = new Map()
    private listener: net.Server | undefined

    private constructor() { }

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

    public async start() {
        // Listen on 
        this.listener = net.createServer((clientSocket) => {
            logger.info(`[Tunnel] Recived connection from ${clientSocket.remoteAddress}`);

            logger.info("[Tunnel] Allocating port...");
            const allowedPort = this.getFreePort()
            logger.info(`[Tunnel] Port allocated: ${allowedPort}`);

            // Then create server for that port
            let tcpSocket = net.createServer((forwardSocket) => {
                logger.info(`[Tunnel] Connection established on port ${allowedPort}`);

                forwardSocket.setKeepAlive(true);
                clientSocket.setKeepAlive(true);
                forwardSocket.setTimeout(0);
                clientSocket.setTimeout(0);

                // Forward the original client request
                forwardSocket.pipe(clientSocket, { end: false });
                clientSocket.pipe(forwardSocket, { end: false });

                clientSocket.on('end', () => {
                    forwardSocket.end();
                    logger.info(`[Tunnel] Client socket ended`);
                });

                // Handle errors
                forwardSocket.on('error', (error) => {
                    logger.error(`[Tunnel] Forward socket error: ${error.message}`);
                    clientSocket.end();
                });

                clientSocket.on('error', (error) => {
                    logger.error(`[Tunnel] Client socket error: ${error.message}`);
                    forwardSocket.end();
                });
            });

            tcpSocket.listen(allowedPort, () => {
                logger.info(`[Tunnel] Forward server listening on port ${allowedPort}`);
            });

            tcpSocket.on('error', (error) => {
                logger.error(`[Tunnel] TCP Server error: ${error.message}`);
                this.clearPort(allowedPort);
            });

            this.listenersMap.set(allowedPort, tcpSocket)

            // Cleanup when the initial connection closes
            clientSocket.on('close', () => {
                logger.info(`[Tunnel] Client connection closed`);
                this.clearPort(allowedPort);
                tcpSocket.close();
            });

            const portPacket = new ForwardPacket({
                hostname: "localhost",
                externalPort: allowedPort,
                internalPort: INTERNALPORT
            });
            
            PacketManager.getInstance().sendPacket(portPacket);
        })

        this.listener.listen(LISTENPORT, () => {
            logger.info(`Forwarding listening on port ${LISTENPORT}`);
        });
    }
}