import chalk from 'chalk';
import pino, { type Logger } from 'pino';
import pretty from 'pino-pretty';

let log:
  | Logger<{
      browser: {
        asObject: true;
      };
      customLevels: {
        debug: number;
        verbose: number;
        info: number;
        warn: number;
        error: number;
      };
    }>
  | undefined;

export default function logger() {
  if (log === undefined) {
    const stream = pretty({
      translateTime: 'yy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
      colorize: false,
      customPrettifiers: {
        level: (logLevel: any) => {
          const levelLabel = pino.levels.labels[logLevel].toLowerCase();

          switch (levelLabel) {
            case 'debug':
              return `${chalk.blueBright(pino.levels.labels[logLevel])}`;
            case 'info':
              return `${chalk.greenBright(pino.levels.labels[logLevel])}`;
            case 'warn':
              return `${chalk.yellowBright(pino.levels.labels[logLevel])}`;
            case 'error':
              return `${chalk.redBright(pino.levels.labels[logLevel])}`;
            default:
              return `${chalk.greenBright(pino.levels.labels[logLevel])}`;
          }
        },
      },
      sync: true,
    });

    const fileStream = pino.destination({
      dest: './log/fm.log',
      sync: false,
      mkdir: true,
    });

    log = pino(
      {
        browser: { asObject: true },

        customLevels: {
          debug: pino.levels.values.trace,
          verbose: pino.levels.values.debug,
          info: pino.levels.values.info,
          warn: pino.levels.values.warn,
          error: pino.levels.values.error,
        },
      },
      process.env.FILE_LOG_MODE !== 'true' ? stream : fileStream,
    );

    log.level = process.env.LOG_LEVEL ?? 'info';
  }

  return log;
}
