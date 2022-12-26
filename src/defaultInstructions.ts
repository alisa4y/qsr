import { XElement } from "./types"
import { DataSetter, buildDataSetter } from "./ElementProxy"

export const defaultInstructions = {
  template: defineTemplates,
}

function defineTemplates(template: XElement & HTMLTemplateElement) {
  if (!template.id) return
  const dataSetter = new DataSetter()
  const setter = buildDataSetter(
    template.content as unknown as Element,
    dataSetter
  )
  ;(template as any).__setter = function (data: any) {
    let elmArgs = getElmArgs(this, dataSetter)
    const args = [data, ...elmArgs]
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
