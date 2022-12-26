export type Fn = (...args: any[]) => any
export interface XElement extends Element {
  eval: any
  dataset?: Record<string, any>
  __set: (data: any) => void
  __applied?: Record<string, boolean>
  __cleanup?: Record<string, Fn>
}
