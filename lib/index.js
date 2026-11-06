import makeWASocket from './Socket/index.js';
import chalk from 'chalk';

console.log(chalk.hex('#00c2ff')(`
██╗     ██╗███╗   ██╗██╗██╗   ██╗███████╗███╗   ██╗██╗   ██╗
██║     ██║████╗  ██║██║██║   ██║██╔════╝████╗  ██║██║   ██║
██║     ██║██╔██╗ ██║██║██║   ██║███████╗██╔██╗ ██║██║   ██║
██║     ██║██║╚██╗██║██║╚██╗ ██╔╝╚════██║██║╚██╗██║██║   ██║
███████╗██║██║ ╚████║██║ ╚████╔╝ ███████║██║ ╚████║╚██████╔╝
╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝ ╚═════╝
`));

console.log(chalk.hex('#00c2ff')(
    'LiniusNv — Advanced WhatsApp WebSocket Library\n'
));

console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.green('✓ Library initialized successfully'));
console.log(chalk.green('✓ No automatic channel following'));
console.log(chalk.gray('✓ No forced newsletter subscriptions'));
console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

console.log(chalk.cyan('\nThank you for using LiniusNv!'));
console.log(chalk.gray('Developed and maintained by LiniusNv.'));
console.log(chalk.gray('GitHub: https://github.com/LiniusNv-Bail/Bails'));
console.log(chalk.hex('#00c2ff')('\nEnjoy building with LiniusNv!\n'));

export * from '../WAProto/index.js';
export * from './Utils/index.js';
export * from './Types/index.js';
export * from './Defaults/index.js';
export * from './WABinary/index.js';
export * from './WAM/index.js';
export * from './WAUSync/index.js';
export * from './Store/index.js';

export { makeWASocket };
export default makeWASocket;

//# sourceMappingURL=index.js.map