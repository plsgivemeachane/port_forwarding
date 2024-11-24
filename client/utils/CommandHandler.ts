import OpenPortPacket from '../Packet/impl/OpenPortPacket';
import PacketManager from '../Packet/PacketManager';
import { logger } from './winston';

export type Protocol = 'tcp' | 'udp' | 'http' | 'https';
export type CommandAction = 'open' | 'close';

export class CommandHandler {
    private static validatePort(port: number): boolean {
        return port > 0 && port < 65536;
    }

    private static validateProtocol(protocol: string): protocol is Protocol {
        return ['tcp', 'udp', 'http', 'https'].includes(protocol.toLowerCase());
    }

    private static normalizeProtocol(protocol: Protocol): Protocol {
        if (protocol === 'http') return 'tcp';
        if (protocol === 'https') return 'tcp';
        return protocol;
    }

    private static getPortForProtocol(protocol: Protocol): number {
        switch (protocol) {
            case 'http': return 80;
            case 'https': return 443;
            default: throw new Error('Port number is required for TCP/UDP protocols');
        }
    }

    public handleCommand(input: string): void {
        const parts = input.trim().toLowerCase().split(' ');
        
        // Parse command parts
        const [action, protocol, portStr] = parts;

        // Validate basic command format
        if (!action || !protocol) {
            logger.error('Invalid command format. Usage: (open|close) <tcp/udp/http/https> [port]');
            return;
        }

        // Validate action
        if (action !== 'open' && action !== 'close') {
            logger.error('Invalid action. Must be either "open" or "close"');
            return;
        }

        // Validate protocol
        if (!CommandHandler.validateProtocol(protocol)) {
            logger.error('Invalid protocol. Must be one of: tcp, udp, http, https');
            return;
        }

        // Protocol-specific validation
        if ((protocol === 'http' || protocol === 'https') && portStr) {
            logger.error(`Cannot specify custom port for ${protocol.toUpperCase()}. Uses port ${protocol === 'http' ? '80' : '443'} by default`);
            return;
        }

        if ((protocol === 'tcp' || protocol === 'udp') && !portStr) {
            logger.error(`Port number is required for ${protocol.toUpperCase()} protocol`);
            return;
        }

        try {
            // Parse and validate port
            let port: number;
            
            if (protocol === 'http' || protocol === 'https') {
                port = CommandHandler.getPortForProtocol(protocol as Protocol);
            } else {
                port = parseInt(portStr, 10);
                if (!CommandHandler.validatePort(port)) {
                    logger.error('Invalid port number. Must be between 1 and 65535');
                    return;
                }
            }

            // Normalize protocol (http/https -> tcp)
            const normalizedProtocol = CommandHandler.normalizeProtocol(protocol as Protocol);

            // Log the command execution
            logger.info(`Executing command: ${action} ${normalizedProtocol} port ${port}`);
            
            // Here you would typically call your port forwarding logic
            // TODO: Integrate with actual port forwarding implementation
            
            if(normalizedProtocol === "udp") {
                // not implemented
                throw new Error("UDP not implemented");
            }

            const packet = new OpenPortPacket(port);
            PacketManager.getInstance().sendPacket(packet);
        } catch (error) {
            if (error instanceof Error) {
                logger.error(error.message);
            } else {
                logger.error('An unknown error occurred while processing the command');
            }
        }
    }
}
