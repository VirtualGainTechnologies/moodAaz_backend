const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, splat } = format;

const enumerateErrorFormat = format((info) => {
  if (info instanceof Error) {
    return {
      ...info,
      message: info.message,
      stack: info.stack,
      name: info.name,
    };
  }
  return info;
});

exports.logger = createLogger({
  level: process.env.NODE_ENV === "DEVELOPMENT" ? "debug" : "info",
  format: combine(
    enumerateErrorFormat(),
    timestamp({ format: "DD:MM:YYYY HH:MM:SS" }),
    process.env.NODE_ENV === "PRODUCTION"
      ? format.uncolorize()
      : format.colorize(),
    splat(),
    printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports:
    process.env.NODE_ENV === "PRODUCTION"
      ? [
          new transports.File({
            filename: "error.log",
            level: "error",
            format: combine(
              timestamp({ format: "DD:MM:YYYY HH:MM:SS" }),
              format.uncolorize(),
              format.json()
            ),
          }),
          new transports.File({
            filename: "combined.log",
            format: combine(
              timestamp({ format: "DD:MM:YYYY HH:MM:SS" }),
              format.uncolorize(),
              format.json()
            ),
          }),
          new transports.Console({
            stderrLevels: ["error"],
          }),
        ]
      : [
          new transports.Console({
            stderrLevels: ["error"],
          }),
        ],
  ...(process.env.NODE_ENV === "PRODUCTION" && {
    exceptionHandlers: [
      new transports.File({
        filename: "exceptions.log",
        format: combine(
          timestamp({ format: "DD:MM:YYYY HH:MM:SS" }),
          format.uncolorize(),
          format.json()
        ),
      }),
    ],
  }),
});
