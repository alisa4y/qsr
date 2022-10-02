import { qsa, ael, qs, ce } from "./tools.js"
import { err, forin, isNumber, oKeys, ox } from "js-tools"

// TODO: add pseudo selector like :click support for jss

export function domTraversal(cb, elm = document.body) {
  cb(elm)
  for (let child of elm.children) {
    domTraversal(cb, child)
  }
}

const defineElements = () =>
  qsa("template").forEach(template => {
    const dataSetter = new DataSetter()
    const setter = buildDataSetter(template.content, dataSetter)

    customElements.define(
      "t-" + template.id,
      class extends HTMLElement {
        connectedCallback() {
          this.appendChild(template.content.cloneNode(true))
          let elmArgs = getElmArgs(this, dataSetter)
          const args = [null, ...elmArgs]
          this.__set = data => {
            args[0] = data
            setter.apply(null, args)
          }
        }
      }
    )
  })

function extendsHtmlProto() {
  Object.defineProperty(HTMLElement.prototype, "eval", {
    set(v) {
      setHtmlElm(this, v)
    },

    get() {
      return this.__get ?? (this.__get = lift(this))
    },
  })
}
const clean = elm => forin(elm.__cleanup, fn => fn())
const addItem = (elm, item) => {
  elm.appendChild(document.createElement("t-" + item))
}
const defaultInstructions = {
  "*[data-item-add]": elm => {
    let pre = elm.previousElementSibling
    let next = elm.nextElementSibling
    while (pre || next) {
      if (pre?.dataset.item) {
        return ael(elm, "click", () => addItem(pre, pre.dataset.item))
      }
      if (next?.dataset.item) {
        return ael(elm, "click", () => addItem(next, next.dataset.item))
      }
      pre = pre?.previousElementSibling
      next = next?.nextElementSibling
    }
    err("couldn't find element with item attribute to set adder")
  },
  "*[data-item-remove]": elm => {
    let parent = elm.parentElement
    let grandParent = parent.parentElement

    while (grandParent) {
      if (grandParent.getAttribute("data-item")) {
        return ael(elm, "click", e => {
          e.stopImmediatePropagation()
          parent.remove()
          // broadcast(grandParent)
        })
      }
      parent = grandParent
      grandParent = grandParent.parentElement
    }
  },
}
const genId = (function () {
  let id = 0
  return () => "id" + id++
})()
export const jss = (instructions = {}, root) => {
  instructions = { ...defaultInstructions, ...instructions }
  function applyInstructions(elm) {
    forin(instructions, (fn, selector) => {
      if (!elm.__applied?.[selector] && elm.matches(selector)) {
        const cleanup = fn(elm)
        if (typeof cleanup === "function") {
          elm.__cleanup ??= {}
          elm.__cleanup[selector] = cleanup
        }
        elm.__applied ??= {}
        elm.__applied[selector] = true
      }
    })
  }
  ael(window, "load", () => {
    extendsHtmlProto()
    defineElements()
    domTraversal(applyInstructions)
    const observer = new MutationObserver(mutationList => {
      mutationList.forEach(mutation => {
        switch (mutation.type) {
          case "childList":
            ;[...mutation.addedNodes]
              .filter(node => node.nodeType === 1)
              .forEach(elm => domTraversal(applyInstructions, elm))
            ;[...mutation.removedNodes]
              .filter(node => node.type === 1)
              .forEach(elm => domTraversal(clean, elm))
            break
          case "attributes":
            const elm = mutation.target
            elm.__applied &&
              oKeys(elm.__applied)
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
}
const definePropertyDescriptor = (obj, key, get, set) => {
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: false,
    get,
    set,
  })
}
function lift(elm, data = {}) {
  const { branch, key, item } = elm.dataset
  if (branch) {
    data = branch.split(".").reduce((o, k) => (o[k] = {}), data)
  }
  if (item && key === undefined) {
    return createArrayEval(elm)
  }
  if (key) {
    if (item) {
      const arrayEval = createArrayEval(elm)
      definePropertyDescriptor(
        data,
        key,
        () => arrayEval,
        v => setHtmlElm(elm, v)
      )
    } else {
      const prop = elm.value === undefined ? "textContent" : "value"
      let getter
      if (elm.getAttribute("type") === "number")
        getter = () => parseInt(elm[prop])
      else getter = () => elm[prop]
      definePropertyDescriptor(data, key, getter, v => setHtmlElm(elm, v))
    }
    return data
  }
  for (const child of elm.children) lift(child, data)
  return data
}
function createSetter(elm, ds) {
  const { branch, key } = elm.dataset || {}
  let convertedCount = 0

  if (branch || key) {
    ds.mapData([branch, key].filter(k => k).join("."))
    convertedCount++
  }
  buildSetter(elm, ds)
  while (convertedCount-- > 0) ds.dataVars.pop()
}
function buildSetter(elm, ds) {
  const { key, item } = elm.dataset || {}
  if (key) {
    if (item) {
      ds.setArray(item, elm)
    } else ds.setContent(elm)
    ds.inChild.length > 0 && ds.usedDepth.push([...ds.childDepth])
  } else if (item) {
    ds.setArray(item, elm)
  } else
    for (let i = 0; i < elm.children.length; i++) {
      const child = elm.children[i]
      ds.inChild(i)
      createSetter(child, ds)
      ds.outChild()
    }
}
class DataSetter {
  constructor() {
    this.elmArgs = new Args()
    this.dataVars = ["data"]
    this.body = ""
    this.usedDepth = []
    this.childDepth = []
    this.varId = 0
  }
  genDataVar() {
    this.dataVars.push("_" + this.varId++)
  }
  mapData(branch) {
    this.genDataVar()
    const [dataVar, newDataVar] = this.dataVars.slice(-2)
    this.body += `let ${newDataVar}=${dataVar}.${branch}\n`
  }
  setContent(elm) {
    const prop = elm.value === undefined ? "textContent" : "value"
    const elmName = this.elmArgs.push(elm)
    this.body += `${elmName}.${prop}=${this.dataVars.at(-1)};\n`
  }
  setArray(item, elm) {
    const elmName = this.elmArgs.push(elm)
    const data = this.dataVars.at(-1)
    this.body += `
    if(!Array.isArray(${data})) throw new Error(${data}+" is not an array");
  while(${elmName}.children.length > ${data}.length){${elmName}.removeChild(${elmName}.lastChild);}\n
  while(${elmName}.children.length < ${data}.length){${elmName}.appendChild(document.createElement("t-${item}"));}\n
  {
    let {children} = ${elmName};
    for(let i=0;i < children.length;i++){
      children[i].eval = ${data}[i];
  }}\n`
  }
  inChild(i) {
    this.childDepth.push(i)
  }
  outChild() {
    this.childDepth.pop()
  }
}
function buildDataSetter(elm, ds = new DataSetter()) {
  buildSetter(elm, ds)
  if (!ds.body) return ox
  return new Function("data", ds.elmArgs.params.join(","), ds.body)
}
function genSetter(elm, ds = new DataSetter()) {
  buildSetter(elm, ds)
  if (!ds.body) return ox
  const setter = new Function("data", ds.elmArgs.params.join(","), ds.body)
  const args = [null, ...ds.elmArgs.args]
  return d => {
    args[0] = d
    setter.apply(null, args)
  }
}
class Args {
  constructor() {
    this.args = []
    this.params = []
  }
  push(arg) {
    this.args.push(arg)
    const varName = this.genVar()
    this.params.push(varName)
    return varName
  }
  genVar() {
    return "a" + Args.id++
  }
  static id = 0
}
function getElmArgs(elm, ds) {
  return ds.usedDepth.map(depth => depth.reduce((e, i) => e.children[i], elm))
}
function setHtmlElm(elm, v, visitedElms = new Set()) {
  // if (visitedElms.has(elm)) return
  ;(elm.__set ?? (elm.__set = genSetter(elm)))(v)
  // broadcast(elm, visitedElms)
}
const arProto = Array.prototype
function createArrayEval(elm) {
  return new Proxy([], {
    set(t, p, v) {
      if (isNumber(p)) {
        elm.children[p].eval = v
      }
      return true
    },
    get(t, p) {
      if (isNumber(p)) return elm.children[p].eval
      switch (p) {
        case "push":
          return (...v) => {
            v.map(value => {
              let item = ce("t-" + elm.dataset.item)
              elm.append(item)
              item.eval = value
            })
          }
        case "pop":
          return () => elm.lastChild.remove()
        case "unshift":
          return (...v) => {
            v.map(value => {
              let item = ce("t-" + elm.dataset.item)
              elm.insertBefore(item, elm.firstChild)
              item.eval = value
            })
          }
        case "shift":
          return () => elm.firstChild.remove()
        case "splice":
          return (startIndex, deleteCount, ...v) => {
            for (
              let i = startIndex;
              i < startIndex + deleteCount - v.length;
              i++
            ) {
              elm.children[i].remove()
            }
            let startElm = elm.children[startIndex]
            v.forEach(value => {
              let item = ce("t-" + elm.dataset.item)
              startElm.insertAfter("afterend", item)
              item.eval = value
              startElm = startElm.nextElementSibling
            })
          }
        case length:
          return elm.children.length
        default:
          return arProto[p].bind([...elm.children].map(child => child.eval))
      }
    },
  })
}
