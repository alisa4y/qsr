import { ael, domTraversal, qsa } from "./tools"
import { Instruction, XElement } from "./types"
import { ox } from "vaco"

// TODO: add pseudo selector like :click support for qsr

// --------------------  query selector css format like  --------------------
let qsrfn = (instructions: Record<string, Instruction["handler"]>) => {
  const insArray = instructions2array(instructions)

  switch (document.readyState) {
    case "complete":
    case "interactive":
      initQsr(insArray)

      break
    case "loading":
      ael(window, "DOMContentLoaded", () => initQsr(insArray))
      qsrfn = newInstructions =>
        mutateInstructions(insArray, instructions2array(newInstructions))

      break
  }
}
export const qsr: typeof qsrfn = (...args) => qsrfn(...args)

function initQsr(insArray: Instruction[]) {
  domTraversal(e => applyInstructionsToElm(insArray, e), document.body as any)
  observe(insArray, document.body)

  qsrfn = newInstructions => {
    domTraversal(e => applyInstructionsToElm(insArray, e), document.body as any)
    mutateInstructions(insArray, instructions2array(newInstructions))
  }
}
export function qsh(
  ins: Record<string, Instruction["handler"]>,
  root: XElement | HTMLElement,
  { watch }: Options = {}
) {
  const insArray = instructions2array(ins)

  switch (document.readyState) {
    case "complete":
    case "interactive":
      domTraversal(e => applyInstructionsToElm(insArray, e), root as XElement)
      break
    case "loading":
      ael(window, "DOMContentLoaded", () =>
        domTraversal(e => applyInstructionsToElm(insArray, e), root as XElement)
      )
      break
  }

  if (watch) observe(insArray, root)
}

// --------------------  helpers  --------------------
function observe(ins: Instruction[], elm: XElement | HTMLElement) {
  const observer = new MutationObserver(mutationList => {
    mutationList.forEach(mutation => {
      switch (mutation.type) {
        case "childList":
          Array.from(mutation.addedNodes)
            .filter(node => node.nodeType === 1)
            .forEach(elm =>
              domTraversal(e => applyInstructionsToElm(ins, e), elm as XElement)
            )
          Array.from(mutation.removedNodes)
            .filter(node => node.nodeType === 1)
            .forEach(elm => domTraversal(clean, elm as XElement))

          break

        case "attributes":
          const elm = mutation.target as XElement

          if (elm.__applied !== undefined)
            Array.from(elm.__applied.entries())
              .filter(([{ query }]) => !elm.matches(query))
              .forEach(([, cleanup]) => cleanup())

          applyInstructionsToElm(ins, elm)

          break
      }
    })
  })
  observer.observe(elm, {
    childList: true,
    subtree: true,
    attributes: true,
  })
}
function applyInstructionsToElm(instructions: Instruction[], elm: XElement) {
  const applied: XElement["__applied"] = elm.__applied || new Map()

  instructions
    .filter(ins => !applied.has(ins) && elm.matches(ins.query))
    .forEach(ins => {
      applied.set(ins, ins.handler(elm) || ox)
    })

  if (applied.size > 0) elm.__applied = applied
}
function clean(elm: XElement) {
  if (elm.__applied !== undefined)
    Array.from(elm.__applied.values()).forEach(fn => fn())
}
function instructions2array(
  inss: Record<string, Instruction["handler"]>
): Instruction[] {
  return Object.keys(inss).map(key => ({ query: key, handler: inss[key] }))
}
function mutateInstructions(inss1: Instruction[], inss2: Instruction[]): void {
  inss2
    .filter(
      ({ query, handler }: Instruction) =>
        !inss1.some(({ query: q, handler: h }) => q === query && h === handler)
    )
    .forEach(ins => {
      inss1.push(ins)
    })
}
// --------------------  types  --------------------
type Options = {
  watch?: boolean
}
// type Instructions = Record<string, (elm: XElement) => void | Fn>
