import ForwardPacket from "../Packet/impl/ForwardPacket";
import PacketManager from "../Packet/PacketManager";
import { logger } from "../utils/winston";
import net from 'net'

const INTERNALPORT = 8000
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
        let port = 10000 // Base Port
        while (this.usagePort.includes(port)) {
            port++
        }
        this.usagePort.push(port)
        return port
    }

    public async start() {
        // Listen on 
        this.listener = net.createServer((clientSocket) => {
            logger.info(`Recived connection from ${clientSocket.remoteAddress}`);

            logger.info("Allocating port...");
            const allowedPort = this.getFreePort()
            logger.info(`Port allocated: ${allowedPort}`);

            // Keep sockets alive

            // Then create server for that port
            let tcpSocket = net.createServer((forwardSocket) => {
                logger.info(`[Forward] Connection established on port ${allowedPort}`);

                forwardSocket.setKeepAlive(true);
                clientSocket.setKeepAlive(true);

                // Disable timeouts
                forwardSocket.setTimeout(0);
                clientSocket.setTimeout(0);

                let responseComplete = false;
                let responseBuffer = Buffer.alloc(0);

                // Forward the original client request
                forwardSocket.on('data', (data) => {
                    console.log("[Forward] Received from client:");
                    console.log(data.toString('utf8'));
                    clientSocket.write(data);
                    // Accumulate response
                    responseBuffer = Buffer.concat([responseBuffer, data]);

                    // Check if we have a complete response
                    const responseStr = responseBuffer.toString();
                    if (responseStr.includes('\r\n\r\n')) {
                        // If there's Content-Length, check if we have all the content
                        const match = responseStr.match(/Content-Length: (\d+)/i);
                        if (match) {
                            const contentLength = parseInt(match[1]);
                            const headerEnd = responseStr.indexOf('\r\n\r\n') + 4;
                            const bodyLength = responseBuffer.length - headerEnd;

                            if (bodyLength >= contentLength) {
                                responseComplete = true;
                                clientSocket.write(responseBuffer, () => {
                                    logger.info("[Forward] Response sent completely");
                                    // Only now allow the connection to close if needed
                                    responseBuffer = Buffer.alloc(0);
                                });
                            }
                        }
                    }

                });

                // Forward the Thunder Client request to local service
                clientSocket.on('data', (data) => {
                    console.log("[Forward] Received from GET Client:");
                    console.log(data.toString('utf8'));
                    forwardSocket.write(data);
                });

                // Handle socket closures
                forwardSocket.on('end', () => {
                    if (responseComplete) {
                        logger.info(`[Forward] Forward socket ended normally`);
                        clientSocket.end();
                    } else {
                        logger.info(`[Forward] Forward socket ended - waiting for complete response`);
                    }
                });

                clientSocket.on('end', () => {
                    if (responseComplete) {
                        logger.info(`[Forward] Client socket ended normally`);
                        forwardSocket.end();
                    } else {
                        logger.info(`[Forward] Client socket ended - waiting for complete response`);
                    }
                });

                // Handle errors
                forwardSocket.on('error', (error) => {
                    logger.error(`[Forward] Forward socket error: ${error.message}`);
                    clientSocket.end();
                });

                clientSocket.on('error', (error) => {
                    logger.error(`[Forward] Client socket error: ${error.message}`);
                    forwardSocket.end();
                });
            });

            tcpSocket.listen(allowedPort, () => {
                logger.info(`[Setup] Forward server listening on port ${allowedPort}`);
            });

            tcpSocket.on('error', (error) => {
                logger.error(`[Setup] TCP Server error: ${error.message}`);
                this.usagePort = this.usagePort.filter(p => p !== allowedPort);
                this.listenersMap.delete(allowedPort);
            });

            this.listenersMap.set(allowedPort, tcpSocket)

            // Cleanup when the initial connection closes
            clientSocket.on('close', () => {
                logger.info(`[Cleanup] Client connection closed`);
                this.usagePort = this.usagePort.filter(p => p !== allowedPort);
                this.listenersMap.delete(allowedPort);
                tcpSocket.close();
            });

            const portPacket = new ForwardPacket({
                hostname: "localhost",
                externalPort: allowedPort,
                internalPort: INTERNALPORT
            });

            // Client -> 8000 -> server.
            // Server allowcating and reverse forwarding the 8000 port
            // Serve2 get the 8000 port and forward it to 8000

            PacketManager.getInstance().sendPacket(portPacket);
        })

        this.listener.listen(LISTENPORT, () => {
            logger.info(`Forwarding listening on port ${LISTENPORT}`);
        });
    }
}