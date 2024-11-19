import ForwardPacket from "../Packet/impl/ForwardPacket";
import PacketManager from "../Packet/PacketManager";
import { logger } from "../utils/winston";
import net from 'net'
import dotenv from 'dotenv'
dotenv.config()

const BASEPORT = process.env.BASEPORT ? parseInt(process.env.BASEPORT) : 10000
const INTERNALPORT = process.env.INTERNALPORT ? parseInt(process.env.INTERNALPORT) : 8000
const LISTENPORT = process.env.LISTENPORT ? parseInt(process.env.LISTENPORT) : 8001
const SERVERHOSTNAME = process.env.SERVERHOSTNAME || "localhost"

export default class PortForwardingManager {
    private static instance: PortForwardingManager;
    private usagePort: number[] = []
    private listenersMap: Map<number, net.Server> = new Map()
    private listener: net.Server | undefined

    private constructor() { 
        logger.info("Server setup:")
        logger.info(`Base port: ${BASEPORT}`)
        logger.info(`Internal port: ${INTERNALPORT}`)
        logger.info(`Listen port: ${LISTENPORT}`)
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

    public async start() {
        // Listen on 
        this.listener = net.createServer((clientSocket) => {
            logger.info(`[Tunnel] Recived connection from ${clientSocket.remoteAddress}`);
            const allowedPort = this.getFreePort()
            logger.info(`[Tunnel] Port allocated: ${allowedPort}`);
            // Then create server for that port
            let tcpSocket = net.createServer((forwardSocket) => {
                logger.info(`[Tunnel] Connection established on port ${allowedPort}`);
                forwardSocket.setKeepAlive(true);
                clientSocket.setKeepAlive(true);
                forwardSocket.setTimeout(0);
                clientSocket.setTimeout(0);

                // Piping
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

            this.listenersMap.set(allowedPort, tcpSocket)

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
                internalPort: INTERNALPORT
            });
            
            PacketManager.getInstance().sendPacket(portPacket);
        })

        this.listener.listen(LISTENPORT, () => {
            logger.info(`Forwarding listening on port ${LISTENPORT}`);
        });
    }
}