let ar = [1, 2, 3]

const arProto = Array.prototype
const bindedProtos = Object.getOwnPropertyNames(Array.prototype)
  .filter(p => typeof Array.prototype[p] === "function")
  .reduce((o, p) => {
    o[p] = Array.prototype[p].bind(ar)
    return o
  }, {})

let arProxy = new Proxy([], {
  set(t, p, v) {
    ar[p] = v
    return true
  },
  get(t, p) {
    if (bindedProtos[p]) return bindedProtos[p]
    else return ar[p]
  },
  deleteProperty(t, p) {
    delete ar[p]
  },
  ownKeys(t) {
    return
  },
})

ar.push(4)
ar = [1, 2]
console.log(arProxy.length)
