export const rand = (a = Number.MAX_VALUE, b = 0) => {
  const [min, max] = [a, b].sort(), { floor, random } = Math
  return floor(random() * (max - min + 1)) + min;
}