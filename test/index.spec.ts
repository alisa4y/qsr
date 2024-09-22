import userEvent from "@testing-library/user-event"
import { ael, qs, qsa, qsr } from "../src"

describe("eval property", () => {
  test("access element innerText with data-item attribute", async () => {
    document.body.innerHTML = `<div class="info">
      <span data-key="name">hi</span>
  </div>`

    const info = qs(".info")!
    const span = qs("span[data-key]")!

    expect(info.eval.name).toBe("hi")
    expect(span.eval).toBe("hi")
    expect(typeof span.eval).toBe("string")
  })
  test("auto cast type of value if it was number of element innerText when retrieved with type attribute", async () => {
    document.body.innerHTML = `<div class="info">
      <span data-key="num">10</span>
  </div>`

    const info = qs(".info")!
    const span = qs("span[data-key]")!

    expect(info.eval.num).toBe(10)
    expect(span.eval).toBe(10)
    expect(typeof span.eval).toBe("number")
  })
  test("modify element innerText with data-item attribute", async () => {
    document.body.innerHTML = `<div class="info">
    <span data-key="name">hi</span>
  </div>`

    const info = qs(".info")!
    const span = qs("span[data-key]")!
    span.eval = "hello"

    expect(info.eval.name).toBe("hello")
    expect(span.eval).toBe("hello")

    info.eval.name = "greetings"

    expect(info.eval.name).toBe("greetings")
    expect(span.eval).toBe("greetings")
  })
  test("access text-input value with data-item attribute", async () => {
    document.body.innerHTML = `<div class="info">
      <input data-key="name" value="ali"/>
  </div>`

    const info = qs(".info")!
    const inputField = qs("input[data-key]")!

    expect(info.eval.name).toBe("ali")
    expect(inputField.eval).toBe("ali")
  })
  test("modify text-input value with data-item attribute", async () => {
    document.body.innerHTML = `<div class="info">
      <input data-key="name" value="ali"/>
  </div>`

    const info = qs(".info")!
    const inputField = qs("input[data-key]")!
    inputField.eval = "hello"

    expect(info.eval.name).toBe("hello")
    expect(inputField.eval).toBe("hello")

    info.eval.name = "greetings"

    expect(info.eval.name).toBe("greetings")
    expect(inputField.eval).toBe("greetings")

    info.eval = { name: "hi" }

    expect(info.eval.name).toBe("hi")
    expect(inputField.eval).toBe("hi")
  })
  test("branching retrieved object value with data-branch attribute", async () => {
    document.body.innerHTML = `<div class="info">
    <div data-branch="input" class="container">
      <input data-key="name" value="ali"/>
    </div>
    <div>
      <span data-key="name">hi</span>
    </div>
  </div>`

    const info = qs(".info")!
    const inputField = qs("input[data-key]")!
    const span = qs("span[data-key]")!

    expect(inputField.eval).toBe("ali")
    expect(span.eval).toBe("hi")
    expect(info.eval).toEqual({ name: "hi", input: { name: "ali" } })
  })
  test("modifying branched retrieved object value with data-branch attribute", async () => {
    document.body.innerHTML = `<div class="info">
    <div data-branch="input" class="container">
      <input data-key="name" value="ali"/>
    </div>
    <div>
      <span data-key="name">hi</span>
    </div>
  </div>`

    const info = qs(".info")!
    const inputField = qs("input[data-key]")!
    const span = qs("span[data-key]")!
    info.eval = { name: "hello", input: { name: "someName" } }

    expect(inputField.eval).toBe("someName")
    expect(span.eval).toBe("hello")
    expect(info.eval).toEqual({ name: "hello", input: { name: "someName" } })
  })
})
describe("array eval", () => {
  test("get array type when there is data-item attribute", async () => {
    document.body.innerHTML = `<div class="list">
      <ul data-key="counters" data-item="counterItem">
        <li><span data-key="val">1</span></li>
        <li><span data-key="val">2</span></li>
        <li><span data-key="val">3</span></li>
      </ul>
      <template id="counterItem"><li data-key="val">3</li></template>
      </div>`

    const list = qs(".list")!
    const ul = qs("ul")!

    expect(list.eval.counters[0].val).toBe(1)
    expect(JSON.stringify(list.eval.counters)).toBe(
      JSON.stringify([{ val: 1 }, { val: 2 }, { val: 3 }])
    )
    expect(JSON.stringify(ul.eval)).toBe(
      JSON.stringify([{ val: 1 }, { val: 2 }, { val: 3 }])
    )
  })
  test("set array with eval property and data-item attribute set to desired template's id", async () => {
    document.body.innerHTML = `<div class="list">
      <ul data-key="counters" data-item="counterItem"></ul>
      <template id="counterItem">
        <li>
          <span data-key="count">0</span>
        </li></template>
      </div>`

    expect(qsa("li").length).toBe(0)

    const list = qs(".list")!
    const ul = qs("ul")!
    list.eval.counters = [{ count: 10 }, { count: 23 }]

    expect(qsa("li").length).toBe(2)
    expect(JSON.stringify(list.eval.counters)).toBe(
      JSON.stringify([{ count: 10 }, { count: 23 }])
    )
    expect(JSON.stringify(ul.eval)).toBe(
      JSON.stringify([{ count: 10 }, { count: 23 }])
    )
  })
  test("adding item to array by push unshift", async () => {
    document.body.innerHTML = `<div class="list">
    <ul data-key="counters" data-item="counterItem"></ul>
    <template id="counterItem">
      <li>
        <span data-key="count">0</span>
      </li></template>
    </div>`

    expect(qsa("li").length).toBe(0)

    const list = qs(".list")!
    const ul = qs("ul")!
    list.eval.counters.push({ count: 20 })
    ul.eval.push({ count: 110 })

    expect(qsa("li").length).toBe(2)
    expect(JSON.stringify(list.eval.counters)).toBe(
      JSON.stringify([{ count: 20 }, { count: 110 }])
    )
    expect(JSON.stringify(ul.eval)).toBe(
      JSON.stringify([{ count: 20 }, { count: 110 }])
    )

    list.eval.counters.unshift({ count: 10 })
    ul.eval.unshift({ count: -10 })

    expect(JSON.stringify(list.eval.counters)).toBe(
      JSON.stringify([
        { count: -10 },
        { count: 10 },
        { count: 20 },
        { count: 110 },
      ])
    )
    expect(JSON.stringify(ul.eval)).toBe(
      JSON.stringify([
        { count: -10 },
        { count: 10 },
        { count: 20 },
        { count: 110 },
      ])
    )
  })
  test("removing item to array by pop shift", async () => {
    document.body.innerHTML = `<div class="list">
     <ul data-key="counters" data-item="counterItem">
        <li><span data-key="val">1</span></li>
        <li><span data-key="val">2</span></li>
        <li><span data-key="val">3</span></li>
      </ul>
      <template id="counterItem">
      <li>
        <span data-key="count">0</span>
      </li></template>
    </div>`

    const list = qs(".list")!
    const ul = qs("ul")!

    const poped = ul.eval.pop()

    expect(ul.children.length).toBe(2)
    expect(JSON.stringify(list.eval.counters)).toBe(
      JSON.stringify([{ val: 1 }, { val: 2 }])
    )
    expect(JSON.stringify(ul.eval)).toBe(
      JSON.stringify([{ val: 1 }, { val: 2 }])
    )
    expect(poped.val).toBe(3)
    expect(JSON.stringify(poped)).toBe(JSON.stringify({ val: 3 }))

    const shifted = ul.eval.shift()

    expect(ul.children.length).toBe(1)
    expect(JSON.stringify(list.eval.counters)).toBe(
      JSON.stringify([{ val: 2 }])
    )
    expect(JSON.stringify(ul.eval)).toBe(JSON.stringify([{ val: 2 }]))
    expect(shifted.val).toBe(1)
    expect(JSON.stringify(shifted)).toBe(JSON.stringify({ val: 1 }))
  })
  test("using splice method on element with data-item", async () => {
    document.body.innerHTML = `<div class="list">
     <ul data-key="counters" data-item="counterItem">
        <li><span data-key="val">1</span></li>
        <li><span data-key="val">2</span></li>
        <li><span data-key="val">3</span></li>
      </ul>
       <template id="counterItem">
      <li>
        <span data-key="val">0</span>
      </li></template>
    </div>`

    const list = qs(".list")!
    const ul = qs("ul")!
    const deleted = ul.eval.splice(1, 1, { val: 21 }, { val: 22 })

    expect(ul.children.length).toBe(4)
    expect(deleted.length).toBe(1)
    expect(deleted[0].val).toBe(2)
    expect(JSON.stringify(list.eval.counters)).toBe(
      JSON.stringify([{ val: 1 }, { val: 21 }, { val: 22 }, { val: 3 }])
    )
  })
  test("using splice method on item-element with no child", async () => {
    document.body.innerHTML = `<div class="list">
     <ul data-key="counters" data-item="counterItem">
      </ul>
      <template id="counterItem">
      <li>
        <span data-key="val">0</span>
      </li></template>
    </div>`

    const list = qs(".list")!
    const ul = qs("ul")!
    const deleted = ul.eval.splice(1, 1, { val: 21 }, { val: 22 })

    expect(ul.children.length).toBe(3)
    expect(deleted.length).toBe(0)
    expect(JSON.stringify(list.eval.counters)).toBe(
      JSON.stringify([{ val: 0 }, { val: 21 }, { val: 22 }])
    )
  })
})
describe("x attribute", () => {
  test("get x attribute", () => {
    document.body.innerHTML = `<div class="info">
    <div data-x="xxx" data-key="name">hi</div>
</div>`

    const info = qs(".info")!
    const div = qs("div[data-key]")!

    expect(info.eval.name).toBe("xxx")
    expect(div.eval).toBe("xxx")
    expect(typeof div.eval).toBe("string")
    expect(div.getAttribute("data-x")).toBe("xxx")
  })
  test("set x attribute ", () => {
    document.body.innerHTML = `<div class="info">
    <div data-key="name">hi</div>
</div>`

    const info = qs(".info")!
    const div = qs("div[data-key]")!

    div.eval = "xxx"

    expect(info.eval.name).toBe("xxx")
    expect(div.eval).toBe("xxx")
    expect(typeof div.eval).toBe("string")
    expect(div.getAttribute("data-x")).toBe("xxx")
  })
})
describe("real practice", () => {
  test("simulate simple binding an element to a input", async () => {
    document.body.innerHTML = `<div class="info">
      <div data-branch="input" class="container">
        <input data-key="name" />
      </div>
      <div>
        <span data-key="name"></span>
      </div>
    </div>`
    const inputField = qs("input[data-key]")!
    const span = qs("span[data-key]")!

    qsr({
      ".info": elm => {
        ael(inputField, "keyup", e => {
          // .input is from data-branch
          elm.eval.name = elm.eval.input.name
        })
      },
    })
    expect((inputField as any).value).toBe("")
    expect(span.innerHTML).toBe("")

    await userEvent.type(inputField, "hello")

    expect((inputField as any).value).toBe("hello")
    expect(span.innerHTML).toBe("hello")
  })
  test("simple counter", async () => {
    document.body.innerHTML = `<li class="counterComponent">
          <button>-</button>
          <span type="number" data-key="count">0</span>
          <button>+</button>
        </li>`

    const span = qs("span[data-key]")!
    const [dec, plus] = qsa("button")

    qsr({
      ".counterComponent": elm => {
        const [btn_dec, data, btn_inc] = elm.children
        ael(btn_dec, "click", () => (elm.eval = { count: elm.eval.count - 1 }))
        ael(btn_inc, "click", () => elm.eval.count++)
      },
    })
    expect(span.innerHTML).toBe("0")
    dec.click()
    expect(span.innerHTML).toBe("-1")
    dec.click()
    expect(span.innerHTML).toBe("-2")
    plus.click()
    expect(span.innerHTML).toBe("-1")
    plus.click()
    expect(span.innerHTML).toBe("0")
    plus.click()
    plus.click()
    expect(span.innerHTML).toBe("2")
    dec.click()
    expect(span.innerHTML).toBe("1")
  })
})
