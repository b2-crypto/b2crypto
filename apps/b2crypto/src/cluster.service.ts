import { Logger } from '@nestjs/common';
import cluster from 'cluster';
import { cpus } from 'os';
import process from 'process';

const numCPUs = cpus().length;

export class ClusterService {
  static clusterize(callback: () => void): void {
    if (cluster.isPrimary) {
      Logger.log(`Primary ${process.pid} is running with ${numCPUs} CPUs`);

      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }

      cluster.on('exit', (worker, code, signal) => {
        if (signal) {
          Logger.log(
            `worker ${worker.process.pid} was killed by signal: ${signal}`,
          );
        } else if (code !== 0) {
          Logger.log(
            `worker ${worker.process.pid} exited with error code: ${code}`,
          );
        } else {
          Logger.log(`worker ${worker.process.pid} success!`);
        }
      });
    } else {
      callback();
    }
  }
}
