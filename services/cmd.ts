#!/usr/bin/env ts-node
import express from "express";
import { Server } from "http";
import { SlashCreator } from "slash-create";
import { baseRoute } from "~/config";
import { bots, commandsPath } from "~/config";
import { httpHost } from "~/config";
import { httpPort } from "~/config";
import { access } from "~/lib/access";
import { exrouter } from "~/lib/exrouter";
import { logger } from "~/lib/logger";
import { Logger } from "~/lib/logger";
import { main } from "~/lib/main";
import { parser } from "~/lib/parser";

const app = express();
const server = new Server(app);
const router = express.Router();
const creator = new SlashCreator({
  applicationID: bots.cmd.client,
  publicKey: bots.cmd.public,
  token: bots.cmd.token
});

app.disabled('x-powered-by');
app.use(baseRoute, router);

router
  .use(logger())
  .use(parser())
  .use(access(bots.cmd.public));

main(__filename, () => {
  creator
    .withServer(exrouter(router))
    .registerCommandsIn(commandsPath)
    .on('error', Logger.log);

  server.listen(httpPort, httpHost, () =>
    Logger.log(`Server start on ${httpHost}:${httpPort} `));
});