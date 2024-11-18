import net from "net";
import { server } from "typescript";
import { logger } from "../utils/winston";

export default class PortForwarding {
    private static instance: PortForwarding;
    public static getInstance(): PortForwarding {
        if (!this.instance) {
            this.instance = new PortForwarding();
        }
        return this.instance;
    }

    public forward(externalPort: number, internalPort: number, hostname: string) {
        // Connect to forwarding port
        const forwardSocket = new net.Socket();
        forwardSocket.setKeepAlive(true);

        // Connect to local service
        const localSocket = new net.Socket();

        forwardSocket.connect(externalPort, hostname, () => {
            logger.info(`Connected to forward port ${hostname}:${externalPort}`);

            localSocket.connect(internalPort, "127.0.0.1", () => {
                logger.info(`Connected to local service on port ${internalPort}`);
                forwardSocket.pipe(localSocket, { end: true });
                localSocket.pipe(forwardSocket, { end: true });
            });
        });

        // Handle errors
        forwardSocket.on("error", (error) => {
            logger.error(`Forward socket error: ${error.message}`);
            localSocket.destroy();
        });

        localSocket.on("error", (error) => {
            logger.error(`Local socket error: ${error.message}`);
            forwardSocket.destroy();
        });
    }
}
