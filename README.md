# Proxmox Desktop Manager

A clean, minimalistic desktop application for managing Proxmox VE clusters with real-time data visualization.

## Features

- **Real-time Monitoring**: Live data from Proxmox API with no mock/demo content
- **Clean UI**: Minimalistic design focused on functionality
- **Multi-node Support**: Manage multiple Proxmox nodes from one interface
- **VM/CT Management**: Full lifecycle management of virtual machines and containers
- **Resource Monitoring**: CPU, memory, disk, and network statistics
- **User Management**: Role-based access control
- **Storage Management**: Monitor and manage storage pools
- **Network Configuration**: Network interface management
- **Backup Operations**: Backup job scheduling and management

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: TailwindCSS with custom design system
- **Desktop**: Electron 25
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Build**: Webpack + TypeScript compiler

## Installation

```bash
# Install dependencies
npm install

# Start development
npm start

# Build for production
npm run build
npm run electron:pack
```

## Configuration

1. **First Launch**: Configure your Proxmox connection in Settings
2. **Authentication**: Supports PAM, PVE, and AD authentication
3. **SSL**: Option to ignore SSL certificates for self-signed setups
4. **Permissions**: Respects Proxmox user permissions

## Project Structure

```
src/
├── main/                 # Electron main process
│   ├── api/             # Proxmox API integration
│   ├── main.ts          # Application entry point
│   └── preload.ts       # IPC bridge
└── renderer/            # React frontend
    ├── components/      # UI components
    ├── hooks/          # Custom React hooks
    ├── contexts/       # React contexts
    ├── types/          # TypeScript definitions
    └── styles/         # Global styles
```

## Key Components

- **Dashboard**: Real-time cluster overview
- **VM Manager**: Virtual machine operations
- **Container Manager**: LXC container management
- **Storage Manager**: Storage pool monitoring
- **Network Manager**: Network configuration
- **User Manager**: Access control management
- **Settings**: Application configuration

## API Integration

All data comes directly from the Proxmox VE API:
- `/api2/json/nodes` - Node information
- `/api2/json/cluster/resources` - Cluster resources
- `/api2/json/nodes/{node}/qemu` - Virtual machines
- `/api2/json/nodes/{node}/lxc` - Containers
- `/api2/json/storage` - Storage information

## Security

- Secure credential storage
- Respect for Proxmox permissions
- SSL/TLS support
- Session management

## Building

```bash
# Development build
npm run build

# Production build
npm run build
npm run preelectron:pack
npm run electron:pack
```

## License

MIT License - see LICENSE file for details