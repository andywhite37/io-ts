<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Codec interface](#codec-interface)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Codec interface

```ts
export interface Codec<A> extends Decoder<A>, Encoder<A> {}
```

A codec is just a decoder and an encoder packed together.

The following laws must hold

1. `pipe(codec.decode(u), E.fold(() => u, codec.encode) = u` for all `u` in `unknown`
2. `codec.decode(codec.encode(a)) = E.right(a)` for all `a` in `A`

You can build a new codec using the `make` helper

**Example**

```ts
import * as C from 'io-ts/lib/Codec'
import * as D from 'io-ts/lib/Decoder'
import * as E from 'io-ts/lib/Encoder'
import { left, right } from 'fp-ts/lib/Either'

const decoder: D.Decoder<number> = D.parse(D.string, (s) => {
  const n = parseFloat(s)
  return isNaN(n) ? left(`cannot decode ${JSON.stringify(s)}, should be parsable into a number`) : right(n)
})

const encoder: E.Encoder<string, unknown> = {
  encode: String
}

export const NumberFromString: C.Codec<string, number> = C.make(decoder, encoder)
```