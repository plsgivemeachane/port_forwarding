# Server Port Forwarding for Minecraft Server

A free server. And a client that make localhost port forwarding.

## 🏗️ Architecture

The project consists of two main components:

### Client
- Written in TypeScript
- Handles packet serialization and communication with the server
- Manages socket connections and reconnection logic
- Uses environment variables for configuration

### Server
- Socket.IO server for handling client connections
- Dynamic port forwarding system (starting from port 10000)
- TCP tunnel creation for Minecraft server connections

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- TypeScript

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd serverless_minecraft
```

2. Install dependencies for both client and server:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Configure environment variables:

Create a `.env` file in the client directory:
```env
SERVER_URL=http://localhost:8080
SOCKET_RECONNECT_ATTEMPTS=10
SOCKET_RECONNECT_DELAY=2000
```

Create a `.env` file in the server directory:
```env
BASEPORT=10000
INTERNALPORT=25565
LISTENPORT=8001
SERVERHOSTNAME=localhost
```

## 🔧 Configuration

### Client Configuration
- `SERVER_URL`: Socket.IO server URL (default: http://localhost:8080)
- `SOCKET_RECONNECT_ATTEMPTS`: Number of reconnection attempts (default: 10)
- `SOCKET_RECONNECT_DELAY`: Delay between reconnection attempts in ms (default: 2000)

### Server Configuration
- `BASEPORT`: Starting port for dynamic allocation (default: 10000)
- `SERVERHOSTNAME`: Hostname for the server (default: localhost)

## 🎮 Usage

1. Start the server:
```bash
cd server
npm start
```

2. Start the client:
```bash
cd client
npm start
```

3. Connect your Minecraft client to `localhost:8001`

## 🔍 Debugging

Common issues and solutions:

1. "No Server connected to send packet"
   - Check if the server is running
   - Verify environment variables are set correctly
   - Check network connectivity

2. Connection Issues
   - Ensure ports are not blocked by firewall
   - Verify SERVER_URL matches the server's Socket.IO port
   - Check server logs for connection errors

## 📦 Project Structure

```
serverless_minecraft/
├── client/
│   ├── Packet/
│   │   ├── impl/
│   │   ├── PacketManager.ts
│   │   └── PacketParser.ts
│   └── .env
├── server/
│   ├── Packet/
│   │   ├── impl/
│   │   ├── PacketManager.ts
│   │   └── PacketParser.ts
│   └── .env
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.