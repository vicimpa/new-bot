import express from "express";
import { join } from "path";
import { webPort, webHost } from "~/config";
import { Logger } from "~/lib/logger";
import { main } from "~/lib/main";

const app = express()

app.disable('x-powered-by')

app.get('/', (req, res) => {
  res.sendFile(join(process.cwd(), 'index.html'))
})

app.use('/public', express.static(join(process.cwd(), 'public')))
app.use('/node_modules', express.static(join(process.cwd(), 'node_modules')))

main(__filename, () => {
  app.listen(webPort, webHost, () =>
    Logger.log('Webapp start'))
})