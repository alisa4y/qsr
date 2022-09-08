import { forin } from "js-tools"

export function qs(selector, elm = document) {
  return elm.querySelector(selector)
}
export function qsa(selector, elm = document) {
  return [...elm.querySelectorAll(selector)]
}
export function ce(tag, options) {
  const elm = document.createElement(tag)
  forin(options, (value, key) => {
    switch (key) {
      case "text":
      case "textContent":
        elm.textContent = value
        break
      case "html":
        elm.innerHTML = value
        break
      case "class":
        elm.className = value
        break
      case "dataset":
        forin(value, (value, key) => {
          elm.dataset[key] = value
        })
        break
      case "children":
        value.forEach(({ tag, options }) => {
          elm.appendChild(ce(tag, options))
        })
        break
      default:
        if (key.startsWith("data-") && key.length > 5) {
          elm.dataset[key.slice(5)] = value
        } else {
          elm.setAttribute(key, value)
        }
    }
  })
  return elm
}
export function ael(elm, evName, cb, options) {
  elm.addEventListener(evName, cb, options)
}
export const loadScript = src =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script")
    document.body.appendChild(script)
    script.onload = resolve(script)
    script.onerror = reject
    script.async = true
    script.src = src
  })
export function onClickAway(elm, fn) {
  ael(window, "click", e => {
    if (elm.contains(e.target)) return
    fn()
  })
}
export function obs(
  elm,
  cb,
  config = {
    childList: true,
    subtree: true,
    attributes: true,
  }
) {
  if (elm.value === undefined) {
    const observer = new MutationObserver(cb)
    observer.observe(elm, config)
    return observer
  } else {
    return elm.addEventListener("change", () => {
      cb(elm.value)
    })
  }
}
