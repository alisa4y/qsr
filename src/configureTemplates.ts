import { XElement } from "./types"
import { DataSetter, buildDataSetter } from "./ElementProxy"

export function defineTemplates(template: Element & HTMLTemplateElement) {
  if (!template.id) return
  const dataSetter = new DataSetter()
  const setter = buildDataSetter(
    template.content.firstElementChild as unknown as Element,
    dataSetter
  )
  ;(template as any).__setter = function (data: any) {
    let elmArgs = getElmArgs(this, dataSetter)
    const args = [data, ...elmArgs, ...dataSetter.templateArgs.args]
    ;(this as unknown as XElement).__set = (data: any) => {
      args[0] = data
      setter.apply(null, args)
    }
    setter.apply(null, args)
  }
}
function getElmArgs(elm: Element, ds: { usedDepth: number[][] }) {
  return ds.usedDepth.map(depth => depth.reduce((e, i) => e.children[i], elm))
}
