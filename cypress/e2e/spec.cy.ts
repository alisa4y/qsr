import { XElement } from "../../src/types"
describe("qsr eval property", () => {
  beforeEach(() => {
    cy.visit("localhost:3000")
  })
  it("on html elements with data-key it works like this", () => {
    cy.window().then(win => {
      // testing if injection works
      const script = `document.querySelector('.info input').value = 'hi'`
      win.eval(script)
      const inp = cy.get('input[data-key="name"]')
      inp.should("have.value", "hi").then(() => {
        win.eval(`document.querySelector('.info input').eval.name = "test 1"`)
        inp.should("have.value", "test 1").then(() => {
          win.eval(`document.querySelector('.info input').eval = "test 2"`)
          inp.should("have.value", "test 2")
        })
      })
    })
  })
  // it.only("using eval on parent with child contains data-key", () => {
  //   cy.window().then(win => {
  //     const data = { name: "ali", input: { name: "safari" } }
  //     const script = `document.querySelector('.info').eval = ${JSON.stringify(
  //       data
  //     )}`
  //     win.eval(script)
  //     const inp = cy.get(".info input")
  //     const span = cy.get(".info span")
  //     inp.should("have.value", "safari")
  //     span.should("have.text", "ali").then(() => {
  //       // inp.should("have.text", "test 1").then(() => {
  //       //   win.eval(`document.querySelector('.info input').eval = "test 2"`)
  //       //   inp.should("have.text", "test 2")
  //       // })
  //     })
  //   })
  // })
  it("can set rules like css", () => {
    const inp = cy.get('input[data-key="name"]')
    const inpEcho = cy.get('span[data-key="name"]')
    inp.type("hello")
    inpEcho.contains("hello")
    inp.type(" world")
    inpEcho.contains("hello world")
  })
})
describe("it's reactive like css", () => {
  it("upade element whenevr it's selector changes", () => {
    cy.visit("http://localhost:3000/observe")
    cy.get("button.change-color").click()
    cy.get(".blue").should("have.css", "background-color", "rgb(0, 0, 255)")
  })
})
describe("data item that behaves as array", () => {
  it("simply can modify some counter", () => {
    cy.visit("localhost:3000")
    cy.get("button").contains("add").click()
    const sum = cy.get('span[data-key="sum"]')
    sum.contains("0")
    cy.get("button").contains("add").click()
    const list = cy.get("ul[data-key='counters']")
    const ch = list.children().first()
    ch.get("button").first().click()
    ch.get("span[data-key='count']").contains(-1)
    sum.contains("-1")
    const ch2 = cy.get("ul[data-key='counters']").children().eq(1)
    ch2.get("button").eq(4).click()
    ch2.get("span[data-key='count']").contains(1)
    sum.contains("0")
    ch.get("button").eq(2).click()
    sum.contains("1")
  })
  it("can programitically add", () => {
    cy.visit("localhost:3000")
    cy.get("#add2").click()
    cy.get('span[data-key="sum"]').contains(7)
    cy.get("#add2").click()
    cy.get('span[data-key="sum"]').contains(14)
  })
  it("works like an array", () => {
    cy.visit("localhost:3000").then(contentWindow => {
      let sum = cy.get('span[data-key="sum"]')
      const list = contentWindow.document.querySelector(
        "ul[data-item]"
      ) as XElement
      list.eval = [{ count: 1 }, { count: 2 }, { count: 3 }]
      sum.contains(6).then(() => {
        let curLength = list.eval.push({ count: 4 })
        expect(curLength).equal(4)
        sum.contains(10).then(() => {
          let poped = list.eval.pop()
          expect(poped.count).equal(4)
          sum.contains(6).then(() => {
            let shifted = list.eval.shift()
            expect(shifted.count).equal(1)
            sum.contains(5).then(() => {
              curLength = list.eval.unshift({ count: 15 })
              expect(curLength).equal(3)
              sum.contains(20).then(() => {
                curLength = list.eval.push({ count: 5 }, { count: 5 })
                expect(curLength).equal(5)
                expect(listValue(list.eval)).deep.equal([15, 2, 3, 5, 5])
                sum.contains(30).then(() => {
                  let deletedOnes = list.eval.splice(
                    1,
                    2,
                    { count: 5 },
                    { count: 10 }
                  )
                  expect(deletedOnes).deep.equal([{ count: 2 }, { count: 3 }])
                  expect(listValue(list.eval)).deep.equal([15, 5, 10, 5, 5])
                  sum.contains(40).then(() => {
                    deletedOnes = list.eval.splice(
                      0,
                      1,
                      { count: 25 },
                      { count: 30 },
                      { count: 3 }
                    )
                    expect(deletedOnes).deep.equal([{ count: 15 }])
                    expect(listValue(list.eval)).deep.equal([
                      25, 30, 3, 5, 10, 5, 5,
                    ])
                    cy.get("ul[data-item] > :nth-child(3) span")
                      .contains(3)
                      .then(() => {
                        cy.get("ul[data-item] > :nth-child(5) span").contains(
                          10
                        )
                        sum = cy.get('span[data-key="sum"]')
                        sum.contains(83).then(() => {
                          deletedOnes = list.eval.splice(
                            5,
                            4,
                            { count: 12 },
                            { count: 11 }
                          )
                          expect(deletedOnes).deep.equal([
                            { count: 5 },
                            { count: 5 },
                          ])
                          expect(listValue(list.eval)).deep.equal([
                            25, 30, 3, 5, 10, 12, 11,
                          ])
                          sum.contains(96).then(() => {
                            deletedOnes = list.eval.splice(4, 3)
                            expect(deletedOnes).deep.equal([
                              { count: 10 },
                              { count: 12 },
                              { count: 11 },
                            ])
                            expect(listValue(list.eval)).deep.equal([
                              25, 30, 3, 5,
                            ])
                            sum.contains(63).then(() => {
                              deletedOnes = list.eval.splice(3, 13)
                              expect(deletedOnes).deep.equal([{ count: 5 }])
                              expect(listValue(list.eval)).deep.equal([
                                25, 30, 3,
                              ])
                              sum.contains(58).then(() => {
                                expect(list.eval[0].count).equal(25)
                                expect(list.eval[2].count).equal(3)
                              })
                            })
                          })
                        })
                      })
                  })
                })
              })
            })
          })
        })
      })
    })
  })
  function listValue(v: any): number[] {
    return v.map(({ count }) => count)
  }
})
const users1 = [
  { fname: "Lowe", lname: "Dobbin", email: "ldobbin0@live.com" },
  { fname: "Arleta", lname: "Dalgarno", email: "adalgarno1@dion.ne.jp" },
  { fname: "Madge", lname: "Naisbit", email: "mnaisbit2@multiply.com" },
  { fname: "Dietrich", lname: "Eyden", email: "deyden3@surveymonkey.com" },
  { fname: "Guglielmo", lname: "Rennles", email: "grennles4@nps.gov" },
  {
    fname: "Paulo",
    lname: "Ollivierre",
    email: "pollivierre5@japanpost.jp",
  },
]
const users2 = [
  { fname: "Dre", lname: "Speedy", email: "dspeedy6@telegraph.co.uk" },
  {
    fname: "Crista",
    lname: "Dawdary",
    email: "cdawdary7@independent.co.uk",
  },
]
const users3 = [
  { fname: "Lelah", lname: "Matous", email: "lmatous8@youtu.be" },
  { fname: "Audry", lname: "Jeske", email: "ajeske9@amazon.com" },
]
describe("table element ", () => {
  it("works like an array", () => {
    cy.visit("localhost:3000").then(contentWindow => {
      const table = contentWindow.document.querySelector(
        "table > tbody[data-item]"
      ) as unknown as XElement
      table.eval = users1
      cy.get("table > tbody > tr:nth-child(3) > td:nth-child(2)")
        .contains("Naisbit")
        .then(() => {
          // since there is header inside tbody 4th tr means the 3rd row

          expect(table.eval[0].fname).equal("Lowe")
          expect(table.eval[2].lname).equal("Naisbit")

          let curLength = table.eval.push(...users2)
          expect(curLength).equal(8)
          let poped = table.eval.pop()
          expect(poped).deep.equal({
            fname: "Crista",
            lname: "Dawdary",
            email: "cdawdary7@independent.co.uk",
          })

          let shifted = table.eval.shift()
          expect(shifted).deep.equal({
            fname: "Lowe",
            lname: "Dobbin",
            email: "ldobbin0@live.com",
          })
          curLength = table.eval.unshift(shifted)
          expect(curLength).equal(7)

          curLength = table.eval.push(poped)
          expect(curLength).equal(8)

          for (let i = 0; i < 6; i++)
            expect(table.eval[i]).deep.equal(users1[i])

          let deleteElms = table.eval.splice(6, 4, ...users3)
          expect(deleteElms).deep.equal(users2)

          expect(table.eval[6]).deep.equal(users3[0])
        })
    })
  })
})
describe("attribute data-item-data", () => {
  it("automatically evaluate element with attribute data-item-data to list", () => {
    cy.visit("http://localhost:3000").then(cw => {
      const [counterForm, userForm] = cw.document.querySelectorAll(
        "form"
      ) as any as XElement[]
      counterForm.eval = { count: 11 }
      cy.get("form").first().find("[data-item-add]").click()
      cy.get("ul[data-item] > li span").contains(11)
      userForm.eval = users2[0]
      cy.get("form").eq(1).find("[data-item-add]").click()
      cy.get("table > tbody[data-item] > tr > td:nth-child(1)")
        .contains("Dre")
        .then(() => {
          const users: XElement = cw.document.querySelector(
            "#users table > tbody"
          )
          expect(users.eval[0].fname).equal("Dre")
        })
    })
  })
  it("genuinely detect data-item-edit to change item", () => {
    cy.visit("http://localhost:3000").then(cw => {
      const users = cw.document.querySelector(
        "#users table > tbody"
      ) as XElement
      users.eval = users2
      cy.get("#users table > tbody > tr:nth-child(1) [data-item-edit]").click()
      cy.get("#users [data-item-data]:last-child input")
        .first()
        .clear()
        .type("Druid")
      cy.get("#users [data-item-data] [data-item-edit]").click()
      cy.get("#users table > tbody > tr:nth-child(1) td")
        .contains("Druid")
        .then(() => {
          expect(users.eval[0].fname).equal("Druid")
        })
    })
  })
})
