import { Terminal } from "./utils/Terminal";
import fs from "fs";
import { logger } from "./utils/winston";
import PacketManager from "./Packet/PacketManager";
import ExitHandler from "./utils/ExitHandler";
import StatusPacket from "./Packet/impl/StatusPacket";
import PortForwarding from "./port_forwarding/PortForwarding";
import InputHelper from "./utils/InputHelper";

new ExitHandler().setup()

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8080';


if(!fs.existsSync('.minecraft')) {
    // Create a new minecraft folder
    fs.mkdirSync('.minecraft');
}    


const packetManager = PacketManager.getInstance();
packetManager.setup();

// Wait for connection
packetManager.waitForConnection().then( async () => {
    const inputHelper = new InputHelper();
    inputHelper.startListening();
});