import { Terminal } from "./Terminal";
import fs from "fs";
import { logger } from "./utils/winston";
import PacketManager from "./Packet/PacketManager";
import ExitHandler from "./ExitHandler";
import decompress from "decompress";
import StatusPacket from "./Packet/impl/StatusPacket";

new ExitHandler().setup()

async function downloadServer() {
    //TODO Download the server files from server.
    logger.info("Downloaded server files");

    // Request to the server
    const response = await fetch('http://localhost:8080/download');

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

downloadServer();

const packetManager = PacketManager.getInstance()

packetManager.setup();