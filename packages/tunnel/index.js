import { connect } from 'ngrok';
import localtunnel from 'localtunnel';
import fs from 'fs';

export const TunnelTypes = {
    ngrok: 'ngrok',
    localtunnel: 'localtunnel',
};

export const getTunnelUrl = async (ports, type = TunnelTypes.localtunnel) => {
    console.log(`Starting ${type} tunnel on port ${ports}...`);
    switch (type) {
        case TunnelTypes.ngrok:
            console.log('ngrok interfaces: http://localhost:4040');
            const tunnelsPromises = ports.map(async (port) => {
                const tunnelUrl = await connect({
                    proto: 'http',
                    bind_tls: true,
                    addr: port,
                    onStatusChange: status => {
                        console.info(`ngrok status: ${status}`);
                    }
                });
               
                process.on('SIGINT', async () => {
                    console.info('Closing ngrok...');
                    await ngrok.disconnect(tunnelUrl);
                    console.info('ngrok status: disconnected');
                    await fs.writeFileSync('.env.local', '');
                    process.exit();
                });

                return tunnelUrl;
            });
            const tunnelsUrls = Promise.all(tunnelsPromises);
            return tunnelsUrls;

        case TunnelTypes.localtunnel:
            const localTunnelsPromises = ports.map(async (port) => {
                const tunnel = await localtunnel({ port });
                console.info('localtunnel status: connected');

                process.on('SIGINT', async () => {
                    console.info('Closing localtunnel...');
                    tunnel.close();
                    console.info('localtunnel status: disconnected');
                    await fs.writeFileSync('.env.local', '');
                    process.exit();
                });

                tunnel.on('close', () => {
                    console.info('localtunnel status: closed');
                    

                });
                return tunnel.url;
            });
            const localTunnelsUrls = Promise.all(localTunnelsPromises);
            return localTunnelsUrls;
            
        default:
            throw new Error(`Unknown tunnel type: ${type}`);
    }
};

const be_port = process.env.TUNNEL_PORT;
const ws_bot_port = process.env.WS_BOT_PORT;
console.log(be_port, ws_bot_port);

const [be_public_url, ws_bot_public_url] = await getTunnelUrl([be_port, ws_bot_port]);
console.log(`port ${be_port} exposed on ${be_public_url}`);
console.log(`port ${ws_bot_port} exposed on ${ws_bot_public_url}`);


const fileContent = 
`ENDPOINT=${be_public_url}
WS_BOT_URL=${ws_bot_public_url}
`;
fs.writeFileSync('.env.local', fileContent);

