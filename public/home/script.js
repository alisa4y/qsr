import { getRandomInt } from "vaco"
import {
  qsr,
  ael,
  qs,
  findAncestors,
  findNearestAncestorSibling,
} from "../../dist/index.js"

const listS = "ul[data-item]"
qsr({
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
      qs(listS).eval = [...qs(listS).children].map(() => ({
        count: getRandomInt(0, 100),
      }))
    })
  },
  'span[data-key="sum"]': elm => {
    const obs = new MutationObserver(() => {
      elm.eval.sum = qs(listS).eval.reduce((acc, { count }) => count + acc, 0)
    })
    obs.observe(qs(listS), { subtree: true, childList: true })
  },
  "#add2": elm => {
    ael(elm, "click", () => {
      qs(listS).eval.push({ count: 7 })
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
    let list = findNearestAncestorSibling("[data-item]", child)
    if (!list) list = qs("table tbody")
    ael(elm, "click", e => {
      e.preventDefault()
      list.eval.push(dataElm?.eval ?? { count: 0 })
    })
  },
  "[data-item-remove]": elm => {
    const child = findAncestors("[data-item]", elm).at(-2)
    ael(elm, "click", e => child.remove())
  },
  "tbody [data-item-edit]": elm => {
    const [child, list] = findAncestors("[data-item]", elm).slice(-2)
    const form = findNearestAncestorSibling("form:has([data-item-edit])", list)
    const formSubmit = qs("[data-item-edit]", form)
    ael(elm, "click", e => {
      e.preventDefault()
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
