import { qsa, ael, ObserveElm, qs } from "./tools.js"
import { debounce, err, forin, ox } from "js-tools"
import { RO } from "ro"

// TODO:  deep equal set instead of Object.assign
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
          const args = [null, ...elmArgs, ...dataSetter.fnArgs.args]
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
  "*[data-bind]": elm => {
    const { bind } = elm.dataset
    const srcElm = qs(handleSelfSelector(elm, bind))
    bindElm(srcElm, elm)
  },
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
          broadcast(grandParent)
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
function handleSelfSelector(elm, selector) {
  if (selector.includes("&")) {
    if (!elm.id) elm.id = genId()
    return selector.replace("&", `#${elm.id}`)
  }
  return selector
}
export const jss = (instructions = {}, root = document.body) => {
  instructions = { ...defaultInstructions, ...instructions }
  function applyInstructions(elm) {
    forin(instructions, (fn, selector) => {
      s = handleSelfSelector(elm, selector)
      if (!elm.__applied?.[selector] && elm.matches(s)) {
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
    ObserveElm(mutationList => {
      mutationList.forEach(mutation => {
        if (mutation.type === "childList") {
          ;[...mutation.addedNodes]
            .filter(node => node.nodeType === 1)
            .forEach(elm => domTraversal(applyInstructions, elm))
          ;[...mutation.removedNodes]
            .filter(node => node.type === 1)
            .forEach(elm => domTraversal(clean, elm))
        } else if (mutation.type === "attributes") {
          const elm = mutation.target
          if (
            elm.__applied &&
            Object.keys(elm.__applied).some(selector => !elm.matches(selector))
          ) {
            clean(elm)
            const clone = elm.cloneNode(true)
            elm.parentNode.replaceChild(clone, elm)
            applyInstructions(clone)
          } else applyInstructions(elm)
        }
      })
    }, root)
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
  let ar
  if (item) {
    let guard = false
    ObserveElm(() => {
      if (guard) return
      let newAr = [...elm.children].map(c => c.eval)
      if (newAr.length < ar.length)
        for (let i = 0; i < ar.length - newAr.length; i++) ar.pop()
      Object.assign(ar, newAr)
    }, elm)
    const ro = RO({
      ar: [...elm.children].map(c => c.eval),
      setElm: ({ ar }) => {
        guard = true
        setHtmlElm(elm, ar)
        setTimeout(() => {
          guard = false
        }, 100)
      },
    })
    ar = ro.ar
    ro.setElm
    if (key === undefined) return ar
  }
  if (key) {
    if (item) {
      definePropertyDescriptor(
        data,
        key,
        () => ar,
        v => setHtmlElm(elm, v)
      )
    } else {
      const prop = elm.value === undefined ? "textContent" : "value"
      let getter
      if (elm.type === "number") getter = () => parseInt(elm.value)
      else getter = () => elm[prop]
      definePropertyDescriptor(data, key, getter, v => setHtmlElm(elm, v))
    }
    return data
  }
  for (const child of elm.children) lift(child, data)
  return data
}
function createSetter(elm, ds = new DataSetter()) {
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
      ds.setArray(item)
    } else ds.setContent(elm)
  } else if (item) {
    ds.elmArgs.push(elm)
    ds.setArray(item)
  } else
    for (let i = 0; i < elm.children.length; i++) {
      const child = elm.children[i]
      ds.inChild(i)
      createSetter(child, ds)
      ds.outChild()
    }
}
const global_fns = {}
export function g_(name, fn) {
  if (typeof name === "function") return (global_fns[name.name] = name)
  global_fns[name] = fn
}
class DataSetter {
  constructor() {
    this.elmArgs = new Args()
    this.fnArgs = new Args()
    this.dataVars = ["data"]
    this.body = ""
    this.usedDepth = []
    this.childDepth = []
    this.varId = 0
  }
  genVar() {
    return "_" + this.varId++
  }
  genDataVar() {
    const newDataVar = this.genVar()
    this.dataVars.push(newDataVar)
    return [this.dataVars.at(-2), newDataVar]
  }
  mapData(branch) {
    const [dataVar, newDataVar] = this.genDataVar()
    this.body += `let ${newDataVar}=${dataVar}.${branch}\n`
  }
  setContent(elm) {
    const prop = elm.value === undefined ? "textContent" : "value"
    const elmName = this.elmArgs.params.at(-1)
    this.body += `${elmName}.${prop}=${this.dataVars.at(-1)};\n`
  }
  setArray(item) {
    const elmName = this.elmArgs.params.at(-1)
    const data = this.dataVars.at(-1)
    this.body += `
    if(!Array.isArray(${data})) throw new Error(${data}+" is not an array");
  while(${elmName}.children.length > ${data}.length){${elmName}.removeChild(${elmName}.lastChild);}\n
  while(${elmName}.children.length < ${data}.length){${elmName}.appendChild(document.createElement("t-${item}"));}\n
  {
    let {children} = ${elmName};
    for(let i=0;i < children.length;i++){
      children[i].__set(${data}[i]);
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
  createSetter(elm, ds)
  if (!ds.body) return ox
  return new Function(
    "data",
    ds.elmArgs.params.join(","),
    ds.fnArgs.params.join(","),
    ds.body
  )
}
function genSetter(elm, ds = new DataSetter()) {
  buildDataSetter(elm, ds)
  if (!ds.body) return ox
  const setter = new Function(
    "data",
    ds.elmArgs.params.join(","),
    ds.fnArgs.params.join(","),
    ds.body
  )
  const args = [null, ...ds.elmArgs.args, ...ds.fnArgs.args]
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
function bindElm(srcElm, conElm) {
  srcElm.__listeners ??= []
  srcElm.__listeners.push(conElm)
  if (srcElm.value !== undefined)
    ael(srcElm, "input", e => {
      conElm.eval = srcElm.eval
    })
}
function setHtmlElm(elm, v, visitedElms = new Set()) {
  if (visitedElms.has(elm)) return
  ;(elm.__set ?? (elm.__set = genSetter(elm)))(v)
  broadcast(elm, visitedElms)
}
function broadcast(elm, visitedElms = new Set()) {
  if (visitedElms.has(elm)) return
  do {
    if (visitedElms.has(elm)) break
    visitedElms.add(elm)
    elm.__listeners?.forEach(l => {
      setHtmlElm(l, elm.eval, visitedElms)
    })
  } while ((elm = elm.parentElement))
}
