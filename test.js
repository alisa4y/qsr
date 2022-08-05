let i = 0
let n = 0
do {
  i++

  if (i === 3) {
    continue
  }

  n += i
  console.log(n)
} while (i < 5)
