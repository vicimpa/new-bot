import { rand } from "./rand";

const ranges = ['0-9', 'a-z', 'A-Z'];
const symbols: string[] = [];

for (let range of ranges) {
  const [start, end] = range.split('-');

  if (!end || range.length != 3) {
    symbols.push(...start);
  } else {
    let [a, b] = [
      start.charCodeAt(0),
      end.charCodeAt(0)
    ];

    for (let i = a; i <= b; i++)
      symbols.push(String.fromCharCode(i));
  }
}

export const password = (length = 0) => {
  let output = '';

  while (output.length < length) {
    output += symbols[rand(symbols.length - 1)];
  }

  return output;
};