export const functions: Array<() => void> = []

export function main(file: string, callback: (...args: string[]) => any) {
  const [runner, nowfile, ...args] = process.argv
  if(nowfile == file || file == process.env.pm_exec_path)
    Promise.resolve()
      .then(() => functions.map(e => e()))
      .then(() => callback(...args))
      .catch(console.error)
}