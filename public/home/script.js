import { getRandomInt } from "js-tools"
import { g_, jss } from "../../src/jss"
import { ael, qs } from "../../src/tools"

jss({
  ".counter": elm => {
    const [btn_dec, data, btn_inc] = elm.children
    elm.eval = { count: 10 }
    ael(btn_dec, "click", () => (elm.eval = { count: elm.eval.count - 1 }))
    ael(btn_inc, "click", () => (elm.eval = { count: elm.eval.count + 1 }))
  },
  "#logCounters": elm => {
    const parent = elm.parentElement
    ael(elm, "click", () => console.log(parent.eval.counters.map(c => c.count)))
  },
  "#randomSetter": elm => {
    let list = qs("ul[data-item]", elm.parentElement)
    ael(elm, "click", () => {
      list.eval = {
        counters: [...list.children].map(() => ({
          count: getRandomInt(0, 100),
        })),
      }
    })
  },
})
