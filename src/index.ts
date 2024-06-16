import { getLiftProxy, setHtmlElement } from "./ElementProxy"
import { defineTemplates } from "./configureTemplates"
import { ael, qsa } from "./tools"

export * from "./tools"
export * from "./qsr"

// --------------------  initialize  --------------------
initialize()

function initialize(): void {
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
      ;(qsa("template") as HTMLTemplateElement[]).forEach(defineTemplates)

      break
    case "loading":
      ael(window, "DOMContentLoaded", () =>
        (qsa("template") as HTMLTemplateElement[]).forEach(defineTemplates)
      )
  }
}
