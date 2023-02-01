import { ael, qsr, qs } from "../../dist/index.js"

qsr({
  ".green": elm => {
    elm.style.background = "green"
  },
  ".blue": elm => {
    elm.style.background = "blue"
  },
  ".change-color": elm => {
    const div = qs(".green", elm.parentElement)
    ael(elm, "click", e => {
      div.setAttribute("class", "blue")
    })
  },
})
