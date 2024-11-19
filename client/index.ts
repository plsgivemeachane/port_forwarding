import { Terminal } from "./utils/Terminal";
import fs from "fs";
import { logger } from "./utils/winston";
import PacketManager from "./Packet/PacketManager";
import ExitHandler from "./utils/ExitHandler";
import decompress from "decompress";
import StatusPacket from "./Packet/impl/StatusPacket";
import PortForwarding from "./port_forwarding/PortForwarding";

new ExitHandler().setup()

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8080';

async function downloadServer() {
    //TODO Download the server files from server.
    logger.info("Downloaded server files");

    // Request to the server
    const response = await fetch(`${SERVER_URL}/download`);

    // Write to the file
    const fileStream = fs.createWriteStream('.minecraft.zip');
    const file = await response.blob();
    fileStream.write(await file.arrayBuffer());
    fileStream.close();
    
    // Unzip the file
    decompress('.minecraft.zip', '.minecraft').then(() => {
        logger.info("Decompress minecraft server. Ready for running")
        // send ready packet to the server
        PacketManager.getInstance().sendPacket(new StatusPacket({
            status: "set",
            message: "Client ready"
        }))
    });    
}

if(!fs.existsSync('.minecraft')) {
    // Create a new minecraft folder
    fs.mkdirSync('.minecraft');
}    


const packetManager = PacketManager.getInstance();
packetManager.setup();

// Wait for connection
packetManager.waitForConnection().then(() => {
    // send ready packet to the server
    logger.info("Client ready");
    PacketManager.getInstance().sendPacket(new StatusPacket({
        status: "set",
        message: "Client ready"
    }))
});