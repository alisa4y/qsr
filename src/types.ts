export type Fn = (...args: any[]) => any
export type XElement = HTMLElement & {
  eval: any
  __applied?: Map<Instruction, Fn>
}

export type Instruction = {
  query: string
  handler: (elm: XElement) => void | Fn
}
