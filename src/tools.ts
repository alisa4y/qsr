import { XElement } from "./types"

type ScopeElement = XElement | HTMLElement | Document
export function qs(selector: string, elm: ScopeElement = document) {
  return elm.querySelector(selector)
}
export function qsa(selector: string, elm: ScopeElement = document) {
  return [...elm.querySelectorAll(selector)]
}
export function mqs(...queries: [...string[], ScopeElement]) {
  const elm = queries.pop() as XElement
  const result: XElement[] = []
  ;(queries as string[]).map(q => {})
  domTraversal(element => {
    ;(queries as string[]).map((q, index) => {
      if (element.matches(q)) result[index] = element
    })
  }, elm)
  return result
}
export function ma(...names: [...string[], ScopeElement]) {
  const elm = names.pop() as XElement
  return (names as string[]).map(n => elm.getAttribute(n))
}
type ElementOptions = {
  text: string
  textContent: string
  html: string
  innerHTML: string
  class: string
  dataset: Record<string, string>
  children: {
    tag: string
    options: ElementOptions
  }[]
  [key: string]: string | any
}
export function ce(tag: string, options?: Partial<ElementOptions>) {
  const elm = document.createElement(tag)
  for (const field in options) {
    const value = options[field]
    switch (field) {
      case "text":
      case "textContent":
        elm.textContent = value
        break
      case "innerHTML":
      case "html":
        elm.innerHTML = value
        break
      case "class":
        elm.className = value
        break
      case "dataset":
        for (const key in value) {
          const v = value[key]
          elm.dataset[key] = v
        }
        break
      case "children":
        ;(value as unknown as ElementOptions["children"]).forEach(
          ({ tag, options }) => {
            elm.appendChild(ce(tag, options))
          }
        )
        break
      default:
        if (field.startsWith("data-") && field.length > 5) {
          elm.dataset[field.slice(5)] = value
        } else {
          elm.setAttribute(field, value)
        }
    }
  }
  return elm
}
export function ael(
  elm: typeof window | Element,
  evName: keyof DocumentEventMap,
  callback: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
) {
  elm.addEventListener(evName, callback, options)
}
export const loadScript = (src: string) =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script")
    document.body.appendChild(script)
    script.onload = () => resolve(script)
    script.onerror = reject
    script.async = true
    script.src = src
  })
export function onClickAway(elm: Element, callback: () => void) {
  ael(window, "click", e => {
    if (elm.contains(e.target as Node)) return
    callback()
  })
}
export function findAncestors(selector: string, elm: Element) {
  const ancestors: XElement[] = []
  elm = elm.parentElement
  while (elm && !elm.matches(selector)) {
    ancestors.push(elm as XElement)
    elm = elm.parentElement
  }
  if (elm && elm.matches(selector)) {
    ancestors.push(elm as XElement)
    return ancestors
  }
  return []
}
export function findNearestAncestorSibling(selector: string, elm: Element) {
  let found: XElement
  while (elm) {
    found = findNearestSibling(selector, elm) as XElement
    if (found) return found
    elm = elm.parentElement
  }
  return undefined
}
function findNearestSibling(selector: string, elm: Element) {
  let pre = elm.previousElementSibling
  let next = elm.nextElementSibling
  while (pre || next) {
    if (pre?.matches(selector)) return pre
    if (next?.matches(selector)) return next

    pre = pre?.previousElementSibling as HTMLElement
    next = next?.nextElementSibling as HTMLElement
  }
  return undefined
}
export function domTraversal(
  callback: (e: XElement) => void,
  elm: XElement = document.body as unknown as XElement
) {
  callback(elm)
  for (let child of elm.children) {
    domTraversal(callback, child as XElement)
  }
}
