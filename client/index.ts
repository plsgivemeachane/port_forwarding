import { Terminal } from "./Terminal";
import fs from "fs";
import { logger } from "./utils/winston";
import PacketManager from "./Packet/PacketManager";

if(!fs.existsSync('.minecraft')) {
    // Create a new minecraft folder
    fs.mkdirSync('.minecraft');
    //TODO Download the server files from server.
}

const packetManager = PacketManager.getInstance()

packetManager.setup();