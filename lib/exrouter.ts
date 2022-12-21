import { Router } from "express";
import { GatewayServer } from "slash-create";
import { Logger } from "~/lib/logger";

export const exrouter = (router: Router) =>
  new GatewayServer((handler) => {
    router.post('/', (req, res) => {
      try {
        handler(req.body);
      } catch (e) { Logger.log(e); }
    });
  });