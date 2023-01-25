import { ael, jss, qs } from "../../dist/index.js"

jss({
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
