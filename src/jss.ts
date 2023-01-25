import { ael, domTraversal, qsa } from "./tools"
import { Fn, XElement } from "./types"
import { defineTemplates } from "./defaultInstructions"
import { getLiftProxy, setHtmlElement } from "./ElementProxy"

// TODO: add pseudo selector like :click support for jss
type Instructions = Record<string, (elm: XElement) => void | Fn>
let jssfn = (
  instructions: Instructions = {},
  root: HTMLElement = document.body
) => {
  extendsHtmlProto()
  switch (document.readyState) {
    case "complete":
    case "interactive":
      initJSS(instructions, root)
      break
    case "loading":
      ael(window, "DOMContentLoaded", () => initJSS(instructions, root))
      jssfn = newInstructions => Object.assign(instructions, newInstructions)
      break
  }
}
export const jss: typeof jssfn = (...args) => jssfn(...args)
function initJSS(instructions: Instructions, root: HTMLElement) {
  setUpJSS(instructions, root)
  jssfn = newInstructions => {
    domTraversal(e => applyInstructionsToElm(newInstructions, e))
    Object.assign(instructions, newInstructions)
  }
}
function setUpJSS(instructions: Instructions, root: HTMLElement) {
  qsa("template").forEach(defineTemplates)
  domTraversal(e => applyInstructionsToElm(instructions, e))
  const observer = new MutationObserver(mutationList => {
    mutationList.forEach(mutation => {
      switch (mutation.type) {
        case "childList":
          ;[...mutation.addedNodes]
            .filter(node => node.nodeType === 1)
            .forEach(elm =>
              domTraversal(
                e => applyInstructionsToElm(instructions, e),
                elm as XElement
              )
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
          applyInstructionsToElm(instructions, elm)
          break
      }
    })
  })
  observer.observe(root || document.body, {
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
function extendsHtmlProto() {
  Object.defineProperty(HTMLElement.prototype, "eval", {
    set(v) {
      setHtmlElement(this, v)
    },

    get() {
      return this.__get ?? (this.__get = getLiftProxy(this))
    },
  })
}
function clean(elm: XElement) {
  if (elm.__cleanup) Object.values(elm.__cleanup).forEach(fn => fn())
}
