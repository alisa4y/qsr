import { Fn, XElement } from "./types"
import { ox, cache, clone, mapFactory } from "vaco"

// --------------------  constansts  --------------------
const valueRelatedTags = new Set(["INPUT", "TEXTAREA", "SELECT"])
const textOnlyElements = new Set([
  "P", // Paragraph
  "SPAN", // Generic inline text container
  "STRONG", // Strong emphasis (bold)
  "B", // Bold text
  "EM", // Emphasized text (italicized)
  "I", // Italicized text
  "SMALL", // Small print
  "ABBR", // Abbreviation
  "CODE", // Code snippet
  "PRE", // Preformatted text
  "BLOCKQUOTE", // Block quote
  "LABEL", // Form label
  "CITE", // Citation/reference
])
const ArProto = Array.prototype
const genKeys = mapFactory((length: number) => {
  return ["length", ...Array(length).keys()].map(n => n.toString())
})

// --------------------  set description  --------------------
export const buildSetDescription = mapFactory(_buildSetDescription)
function _buildSetDescription(elm: XElement): (v: any) => void {
  const { key, item } = elm.dataset

  if (key) {
    return (item ? setArray4eval : buildKeySetter)(elm)
  }

  const binder = buildGetDescription(elm)()

  return (v: object) => {
    Object.assign(binder, v)
  }
}

// --------------------  get description  --------------------
export const buildGetDescription = mapFactory(_buildGetDescription)
function _buildGetDescription(elm: XElement): () => DataDescriptor {
  const { key, item } = elm.dataset

  if (key) {
    return (item ? buildArrayItemGetter : buildKeyGetter)(elm)
  }

  return () => buildGetDespcriptor(elm, {})
}
function buildGetDespcriptor(
  elm: XElement,
  data: Record<string, any>
): Record<string, any> {
  const { branch, key, item } = elm.dataset

  if (key) {
    Object.defineProperty(data, key, {
      configurable: false,
      enumerable: true,
      get: (item ? buildArrayItemGetter : buildKeyGetter)(elm),
      set: (item ? setArray4eval : buildKeySetter)(elm),
    })

    return data
  }
  if (branch) {
    const newBranch = {}

    Object.defineProperty(data, branch, {
      configurable: false,
      enumerable: true,
      get: () => newBranch,
      set: v => {
        Object.assign(newBranch, v)
      },
    })

    data = newBranch
  }

  for (const child of elm.children) buildGetDespcriptor(child as XElement, data)

  return data
}

// --------------------  data-key handler  --------------------
function buildKeySetter(elm: XElement): (v: any) => void {
  const prop = getValueProp(elm as any)

  return prop === "x"
    ? (v: any) => {
        ;(elm as any).dataset[prop] = v
      }
    : (v: any) => {
        ;(elm as any)[prop] = v
      }
}
function buildKeyGetter(elm: XElement): () => any {
  const prop = getValueProp(elm as any)
  const getter =
    prop === "x" ? () => elm.dataset[prop] : () => (elm as any)[prop]

  return isNumberString(getter()) ? () => parseInt(getter()) : getter
}

// --------------------  get value property  --------------------
function getValueProp(elm: XElement): string {
  return valueRelatedTags.has(elm.tagName)
    ? elm.getAttribute("type") === "checkbox"
      ? "checked"
      : "value"
    : textOnlyElements.has(elm.tagName)
    ? "textContent"
    : "x"
}

// --------------------  array eval  --------------------
function setArray4eval(elm: XElement): (v: any[]) => void {
  const { item } = elm.dataset
  const template = document.getElementById(item!) as HTMLTemplateElement | null

  if (template === null)
    throw new Error(
      `couldn't find template with id ${item}\n\ttemplate with id ${template} is required for element ${elm}`
    )

  return v => {
    if (!Array.isArray(v)) throw new Error(`${v} is not an array`)

    const { children } = elm

    while (children.length > v.length) elm.lastElementChild!.remove()
    while (children.length < v.length) {
      const t = template.content.cloneNode(true) as HTMLElement
      const item = t.children[0]!
      elm.appendChild(item)
    }

    for (let i = 0; i < children.length; i++) {
      ;(children[i] as XElement).eval = v[i]
    }
  }
}
function buildArrayItemGetter(elm: XElement): () => any {
  const arrayEval = createArrayEval(elm)

  return () => arrayEval
}
function createArrayEval(elm: XElement) {
  const template = document.getElementById(
    elm.dataset.item as string
  ) as HTMLTemplateElement

  return new Proxy([], {
    set(t, p, v) {
      if (Number.isInteger(p as string)) {
        ;(elm.children[p as unknown as number] as unknown as XElement).eval = v
      }
      return true
    },
    get(t, p) {
      if (
        typeof p !== "symbol" &&
        isNumberString(p) &&
        Number.isInteger(parseInt(p))
      )
        return (elm.children[p as unknown as number] as unknown as XElement)
          .eval
      switch (p) {
        case "push":
          return (...v: any[]) => {
            v.forEach(value => {
              const item = createItem(template)

              elm.appendChild(item)

              item.eval = value
            })
            return elm.children.length
          }
        case "pop":
          return () => {
            const lastChild = elm.children[elm.children.length - 1]

            if (lastChild) {
              lastChild.remove()

              return clone((lastChild as XElement).eval)
            }

            return undefined
          }
        case "unshift":
          return (...v: any[]) => {
            const firstChild = elm.children[0]

            v.forEach(value => {
              const item = createItem(template)

              elm.insertBefore(item, firstChild)

              item.eval = value
            })
            return elm.children.length
          }
        case "shift":
          return () => {
            const firstChild = elm.children[0]

            if (firstChild) {
              firstChild.remove()

              return clone((firstChild as XElement).eval)
            }

            return undefined
          }
        case "splice":
          return (startIndex: number, deleteCount: number, ...v: any[]) => {
            const length = elm.children.length
            deleteCount = Math.min(deleteCount, length - startIndex)
            const newLength = length - deleteCount + v.length
            const endDeleteIndex = Math.min(startIndex + deleteCount, length)
            const deletedElms = []
            const restElms = []

            for (let i = startIndex; i < endDeleteIndex; i++) {
              deletedElms.push(clone((elm.children[i] as XElement).eval))
            }
            for (let i = endDeleteIndex; i < length; i++) {
              restElms.push(clone((elm.children[i] as XElement).eval))
            }
            for (let i = 0; i < length - newLength; i++) {
              elm.children[startIndex].remove()
            }
            for (let i = 0; i < newLength - length; i++) {
              elm.appendChild(createItem(template))
            }

            ;[...v, ...restElms].forEach((value, index) => {
              ;(elm.children[startIndex + index] as unknown as XElement).eval =
                value
            })

            return deletedElms
          }
        case "length":
          return elm.children.length
        default:
          if (p in ArProto)
            return ArProto[p as any].bind(
              [...elm.children].map(child => (child as XElement).eval)
            )
          return (
            [...elm.children].map(child => (child as XElement).eval) as any
          )[p]
      }
    },
    ownKeys(t) {
      return genKeys(elm.children.length)
    },
  })
}

// --------------------  helpers  --------------------
function createItem(template: HTMLTemplateElement) {
  const t = template.content.cloneNode(true) as HTMLElement

  return t.children[0] as XElement
}
function isNumberString(value: string): boolean {
  return !isNaN(Number(value)) && value.trim?.() !== ""
}

// --------------------  types  --------------------
type DataDescriptor = Record<string, any>
