import { ael, domTraversal } from "./tools"
import { Fn, XElement } from "./types"
import { defaultInstructions } from "./defaultInstructions"
import { getLiftProxy, setHtmlElement } from "./ElementProxy"

// TODO: add pseudo selector like :click support for jss

export let jss = (
  instructions: Record<string, (elm: XElement) => void | Fn> = {},
  root: HTMLElement = document.body
) => {
  instructions = { ...defaultInstructions, ...instructions }
  function applyInstructions(elm: XElement) {
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
  ael(window, "load", () => {
    extendsHtmlProto()
    domTraversal(applyInstructions)
    const observer = new MutationObserver(mutationList => {
      mutationList.forEach(mutation => {
        switch (mutation.type) {
          case "childList":
            ;[...mutation.addedNodes]
              .filter(node => node.nodeType === 1)
              .forEach(elm => domTraversal(applyInstructions, elm as XElement))
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
            applyInstructions(elm)
            break
        }
      })
    })
    observer.observe(root || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  })
  jss = newInstructions => {
    domTraversal(applyInstructions)
    instructions = { ...instructions, ...newInstructions }
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
