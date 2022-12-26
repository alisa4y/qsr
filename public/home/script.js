import { getRandomInt } from "flowco"
import {
  jss,
  ael,
  qs,
  findAncestors,
  findNearestAncestorSibling,
} from "../../dist/index.js"

let list
window.addEventListener("load", () => {
  list = qs("ul[data-item]")
})
jss({
  ".info": elm => {
    ael(qs('input[data-key="name"]', elm), "keyup", e => {
      elm.eval.name = elm.eval.input.name
    })
  },
  ".counterComponent": elm => {
    const [btn_dec, data, btn_inc] = elm.children
    ael(btn_dec, "click", () => (elm.eval = { count: elm.eval.count - 1 }))
    ael(btn_inc, "click", () => (elm.eval = { count: elm.eval.count + 1 }))
  },
  "#randomSetter": elm => {
    ael(elm, "click", () => {
      list.eval = [...list.children].map(() => ({
        count: getRandomInt(0, 100),
      }))
    })
  },
  'span[data-key="sum"]': elm => {
    const obs = new MutationObserver(() => {
      elm.eval.sum = list.eval.reduce((acc, { count }) => count + acc, 0)
    })
    obs.observe(list, { subtree: true, childList: true })
  },
  "#add2": elm => {
    ael(elm, "click", () => {
      list.eval.push({ count: 7 })
    })
  },
  "#users": elm => {
    const table = qs("table > tbody", elm)
    ael(qs(".add", elm), "click", () => {
      table.eval.push({
        fname: randomName(getRandomInt(4, 8)),
        lname: randomName(getRandomInt(4, 8)),
        email: randomName(getRandomInt(6, 13)) + "@gmail.com",
      })
    })
  },
  "[data-item-add]": elm => {
    const dataElm = findAncestors("[data-item-data]", elm).pop()
    let child = elm
    if (dataElm) child = dataElm
    const list = findNearestAncestorSibling("[data-item]", child)
    if (!list)
      return console.warn(
        "couldn't find element with item attribute to set adder"
      )
    ael(elm, "click", e => {
      e.preventDefault()
      list.eval.push(dataElm ?? { count: 0 })
    })
  },
  "[data-item-remove]": elm => {
    const [owner, child] = findAncestors("[data-item]", elm).reverse()
    ael(elm, "click", e => child.remove())
  },
  "tbody [data-item-edit]": elm => {
    const [list, child] = findAncestors("[data-item]", elm).reverse()
    const form = findNearestAncestorSibling("form:has([data-item-edit])", list)
    const formSubmit = qs("[data-item-edit]", form)
    ael(elm, "click", e => {
      form.eval = child.eval
      formSubmit.onclick = e => {
        e.preventDefault()
        child.eval = form.eval
      }
    })
  },
})
function randomName(length) {
  var result = ""
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}
