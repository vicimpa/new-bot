import { MyUTCDate } from "./mydate";
import { timeparser } from "./timeparser";

const getData = (d: MyUTCDate, v: string[]) => v.map(e => d[e] as number);

export const remaining = (input: Date | number | string) => {
  if (typeof input == 'string')
    input = timeparser(input);

  if (input instanceof Date)
    input = input;
  else
    input = new Date(input);

  const keys = ['Y', 'M', 'D', 'h', 'm', 's'];
  const data = getData(new MyUTCDate(input), keys);
  const correct = getData(new MyUTCDate(0), keys);
  return data.map((e, i) => ({ v: e - correct[i], k: keys[i] }))
    .filter(e => e.v).map(e => `${e.v}${e.k}`).join(' ');
};