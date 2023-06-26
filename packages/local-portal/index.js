import { connect } from 'ngrok';
import localtunnel from 'localtunnel';

export const TunnelTypes = {
    ngrok: 'ngrok',
    localtunnel: 'localtunnel',
};

export const getTunnelUrl = async (port, type = TunnelTypes.ngrok) => {
    console.log(`Starting ${type} tunnel on port ${port}...`);
    switch (type) {
        case TunnelTypes.ngrok:
            console.log('ngrok interfaces: http://localhost:4040');

            const tunnelUrl = await connect({
                proto: 'http',
                addr: port,
                onStatusChange: status => {
                    console.info(`ngrok status: ${status}`);
                }
            });

            process.on('SIGINT', async () => {
                console.info('Closing ngrok...');
                await ngrok.disconnect(tunnelUrl);
                console.info('ngrok status: disconnected');
                process.exit();
            });
            return tunnelUrl;
        case TunnelTypes.localtunnel:
            const tunnel = await localtunnel({ port });
            console.info('localtunnel status: connected');

            process.on('SIGINT', async () => {
                console.info('Closing localtunnel...');
                tunnel.close();
                console.info('localtunnel status: disconnected');
                process.exit();
            });

            tunnel.on('close', () => {
                console.info('localtunnel status: closed');
            });
            return tunnel.url;
        default:
            throw new Error(`Unknown tunnel type: ${type}`);
    }
};