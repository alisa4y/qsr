import { buildGetDescription, buildSetDescription } from "./eval"
import { qsr } from "./qsr"
import { ael, qs, qsa } from "./tools"
import { XElement } from "./types"

export * from "./tools"
export * from "./qsr"

// --------------------  main  --------------------
initialize()

// --------------------  initialize  --------------------
function initialize(): void {
  if (HTMLElement.prototype.hasOwnProperty("eval")) return

  Object.defineProperty(HTMLElement.prototype, "eval", {
    set(v) {
      buildSetDescription(this)(v)
    },

    get() {
      return buildGetDescription(this)()
    },
  })
}
