import express from "express";
import { QiwiPaymentsAPI } from "@vicimpa/qiwi-sdk";
import { qiwiPort, qiwiHost, qiwiPrivate } from "~/config";
import { Logger } from "~/lib/logger";
import { main } from "~/lib/main";
import { PaymentModel } from "~/models/Payment";

const app = express()
const api = new QiwiPaymentsAPI(qiwiPrivate)

app.disable('x-powered-by')

app.post('/callback', async (req, res, next) => {
  try {
    const body = await api.parseBody(req as any)
    const sig = req.header('X-Api-Signature-SHA256')
    const isTrue = api.checkNotificationSignature(sig, body)

    if(!isTrue) return res.status(401).send({error: 401})

    const pay = await PaymentModel.findOne({_id: body.bill.billId, isPay: false})

    if(!pay) return res.status(404).send({error: 404})

    pay.isPay = true
    await pay.save()
  }catch(e) { 
    Logger.error(e)
    return res.status(500).send({error: 500})
  }
})

main(__filename, async () => {
  app.listen(qiwiPort, qiwiHost, () =>
    Logger.log('Qiwi listener start'))
})