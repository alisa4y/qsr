import { ael, domTraversal, qsa } from "./tools"
import { Fn, XElement } from "./types"
import { defineTemplates } from "./configureTemplates"
import { getLiftProxy, setHtmlElement } from "./ElementProxy"

// TODO: add pseudo selector like :click support for qsr
type Options = {
  watch?: boolean
}

init()

export function qsh(
  ins: Instructions,
  root: XElement | HTMLElement,
  { watch }: Options = {}
) {
  switch (document.readyState) {
    case "complete":
    case "interactive":
      domTraversal(e => applyInstructionsToElm(ins, e), root as XElement)
      break
    case "loading":
      ael(window, "DOMContentLoaded", () =>
        domTraversal(e => applyInstructionsToElm(ins, e), root as XElement)
      )
      break
  }
  if (watch) observe(ins, root)
}
type Instructions = Record<string, (elm: XElement) => void | Fn>

let qsrfn = (instructions: Instructions) => {
  switch (document.readyState) {
    case "complete":
    case "interactive":
      initQsr(instructions)
      break
    case "loading":
      ael(window, "DOMContentLoaded", () => initQsr(instructions))
      qsrfn = newInstructions => Object.assign(instructions, newInstructions)
      break
  }
}
export const qsr: typeof qsrfn = (...args) => qsrfn(...args)
function initQsr(instructions: Instructions) {
  domTraversal(
    e => applyInstructionsToElm(instructions, e),
    document.body as any
  )
  observe(instructions, document.body)

  qsrfn = newInstructions => {
    domTraversal(
      e => applyInstructionsToElm(newInstructions, e),
      document.body as any
    )
    Object.assign(instructions, newInstructions)
  }
}

function observe(ins: Instructions, elm: XElement | HTMLElement) {
  const observer = new MutationObserver(mutationList => {
    mutationList.forEach(mutation => {
      switch (mutation.type) {
        case "childList":
          ;[...mutation.addedNodes]
            .filter(node => node.nodeType === 1)
            .forEach(elm =>
              domTraversal(e => applyInstructionsToElm(ins, e), elm as XElement)
            )
          ;[...mutation.removedNodes]
            .filter(node => node.nodeType === 1)
            .forEach(elm => domTraversal(clean, elm as XElement))
          break
        case "attributes":
          const elm = mutation.target as XElement
          elm.__applied &&
            Object.keys(elm.__applied)
              .filter(selector => !elm.matches(selector))
              .forEach(selector => {
                elm.__cleanup?.[selector]?.()
                delete elm.__applied[selector]
              })
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
function applyInstructionsToElm(instructions: Instructions, elm: XElement) {
  for (const selector in instructions) {
    const fn = instructions[selector]
    if (!elm.__applied?.[selector] && elm.matches(selector)) {
      const cleanup = fn(elm)
      if (typeof cleanup === "function") {
        elm.__cleanup ??= {}
        elm.__cleanup[selector] = cleanup
      }
      elm.__applied ??= {}
      elm.__applied[selector] = true
    }
  }
}

function clean(elm: XElement) {
  if (elm.__cleanup) Object.values(elm.__cleanup).forEach(fn => fn())
}
function init(): void {
  if (HTMLElement.prototype.hasOwnProperty("eval")) return

  Object.defineProperty(HTMLElement.prototype, "eval", {
    set(v) {
      setHtmlElement(this, v)
    },

    get() {
      return this.__get ?? (this.__get = getLiftProxy(this))
    },
  })

  switch (document.readyState) {
    case "complete":
    case "interactive":
      qsa("template").forEach(defineTemplates)
      break
    case "loading":
      ael(window, "DOMContentLoaded", () =>
        qsa("template").forEach(defineTemplates)
      )
  }
}
