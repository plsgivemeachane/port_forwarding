import express from 'express';
import { join } from "path";
import fs from "node:fs";
import archiver from 'archiver';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import PacketManager from './Packet/PacketManager';
import { registerPackets } from './Packet/PacketRegistry';
import PortForwardingManager from './port_fowarding/port_forwarding_manger';
import ExitHandler from './ExitHandler';
import { logger } from './utils/winston';

const MINECRAFT_DIR = process.env.MINECRAFT_DIR || ".minecraft";
const PORT = process.env.PORT || 8080;
const SERVERHOSTNAME = process.env.SERVERHOSTNAME || "localhost";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH"]
    }
});

// Initialize packet registry
registerPackets();

// Initialize packet manager
const packetManager = PacketManager.getInstance();

// Initialize port forwarding
PortForwardingManager.getInstance().start();

new ExitHandler().setup();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Get the directory path from the request body or query
        const dirPath = req.body.path || req.query.path || '';
        const fullPath = join(MINECRAFT_DIR, dirPath.split('/').slice(0, -1).join('/'));
        
        // Create directory if it doesn't exist
        fs.mkdirSync(fullPath, { recursive: true });
        cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        // Use the last part of the path as filename
        const fileName = req.body.path || req.query.path || file.originalname;
        cb(null, fileName.split('/').pop() || file.originalname);
    }
});

const upload = multer({ storage });

// Middleware
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors({
    "origin": "*"
}));

// Socket.IO connection handling
io.on('connection', (socket) => {
    packetManager.addSocket(socket);
});

// Main endpoint
app.get('/', (req: express.Request, res: express.Response) => {
    res.send('Server is running');
});

// Download endpoint
app.get('/download', async (req: express.Request, res: express.Response) => {
    try {
        const zipPath = join(__dirname, '.minecraft.zip');
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        // Listen for all archive data to be written
        output.on('close', function() {
            logger.info('Archive created, starting download...');
            // Stream the file to response
            const fileStream = fs.createReadStream(zipPath);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="minecraft.zip"');
            fileStream.pipe(res);
        });

        // Listen for warnings
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn('Archive warning:', err);
            } else {
                throw err;
            }
        });

        // Listen for errors
        archive.on('error', (err) => {
            throw err;
        });

        // pipe archive data to the file
        archive.pipe(output);

        // append files from a sub-directory, putting its contents at the root of archive
        archive.directory(join(MINECRAFT_DIR, '.'), false);

        await archive.finalize();
    } catch (error) {
        console.error('Error creating zip:', error);
        res.status(500).send('Error creating zip file');
    }
});

app.get("/download/file", (req: express.Request, res: express.Response) => {
    const path = join(MINECRAFT_DIR, typeof req.query.path === 'string' ? req.query.path : '');
    res.download(path);
})

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).send('No file uploaded');
            return;
        }
        
        // File has been saved by multer
        logger.info('File uploaded:', req.file.path);
        
        // Notify connected clients
        io.emit('fileUpdated', {
            filename: req.file.filename,
            path: req.file.path
        });
        
        res.status(200).send('File uploaded successfully');
        return;
    } catch (error) {
        logger.error('Error uploading file:', error);
        res.status(500).send('Error uploading file');
        return;
    }
});

httpServer.listen(PORT, () => {
    logger.info(`Server running at ${SERVERHOSTNAME}:${PORT}`);
});