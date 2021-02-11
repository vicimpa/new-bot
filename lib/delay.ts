export async function delay(n = 0) {
  return new Promise<void>(resolve => setTimeout(resolve, n))
}