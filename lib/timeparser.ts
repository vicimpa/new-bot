import { MyDate } from "./mydate";

export const timeparser = (string = '', d = new Date(0)) => {
  const date = new MyDate(+d);
  const regExp = /((-?\d+\.?\d*)\s*(h|m|s|D|M|Y))/;

  let re: RegExpExecArray = null;

  while (re = regExp.exec(string)) {
    const [, g, v, k] = re;
    string = string.replace(g, '');
    date[k] += +v;
  }

  return +date;
};