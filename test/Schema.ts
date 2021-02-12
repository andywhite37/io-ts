import * as fc from 'fast-check'
import { HKT, Kind, Kind2, URIS, URIS2 } from 'fp-ts/HKT'
import { isRight } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import * as D from '../src/Decoder'
import * as Eq from '../src/Eq'
import * as G from '../src/Guard'
//import { interpreter, make } from '../src/Schema'
import * as Sch from '../src/Schemable'
import * as A from './Arbitrary'

type MySchemable<S> = Sch.Schemable<S> & Sch.WithString<S> & Sch.WithNumber<S> & Sch.WithType<S>

type MySchemable1<S extends URIS> = Sch.Schemable1<S> & Sch.WithString1<S> & Sch.WithNumber1<S> & Sch.WithType1<S>

type MySchemable2C<S extends URIS2> = Sch.Schemable2C<S, unknown> &
  Sch.WithString2C<S, unknown> &
  Sch.WithNumber2C<S, unknown> &
  Sch.WithType2C<S, unknown>

export interface MySchema<A> {
  <S>(S: MySchemable<S>): HKT<S, A>
}

export function make<A>(schema: MySchema<A>): MySchema<A> {
  return Sch.memoize(schema)
}

export function interpreter<S extends URIS2>(S: MySchemable2C<S>): <A>(schema: MySchema<A>) => Kind2<S, unknown, A>
export function interpreter<S extends URIS>(S: MySchemable1<S>): <A>(schema: MySchema<A>) => Kind<S, A>
export function interpreter<S>(S: MySchemable<S>): <A>(schema: MySchema<A>) => HKT<S, A> {
  return (schema) => schema(S)
}

function check<A>(schema: MySchema<A>): void {
  const arb = interpreter(A.Schemable)(schema)
  const decoder = interpreter(D.Schemable)(schema)
  const guard = interpreter(G.Schemable)(schema)
  const eq = interpreter(Eq.Schemable)(schema)
  // decoders, guards and eqs should be aligned
  fc.assert(fc.property(arb, (a) => isRight(decoder.decode(a)) && guard.is(a) && eq.equals(a, a)))
}

describe('Schema', () => {
  it('string', () => {
    check(make((S) => S.string))
  })

  it('number', () => {
    check(make((S) => S.number))
  })

  /*
  it('boolean', () => {
    check(make((S) => S.boolean))
  })

  it('literal', () => {
    check(make((S) => S.literal('a')))
    check(make((S) => S.literal('a', 1)))
    check(make((S) => S.literal('a', null)))
  })

  it('nullable', () => {
    check(make((S) => S.nullable(S.string)))
  })
  */

  it('type', () => {
    check(
      make((S) =>
        S.type({
          name: S.string,
          age: S.number
        })
      )
    )
  })

  it('partial', () => {
    check(
      make((S) =>
        S.partial({
          name: S.string,
          age: S.number
        })
      )
    )
  })

  it('record', () => {
    check(make((S) => S.record(S.string)))
  })

  it('array', () => {
    check(make((S) => S.array(S.string)))
  })

  it('tuple', () => {
    check(make((S) => S.tuple()))
    check(make((S) => S.tuple(S.string)))
    check(make((S) => S.tuple(S.string, S.number)))
  })

  it('intersect', () => {
    check(make((S) => pipe(S.type({ a: S.string }), S.intersect(S.type({ b: S.number })))))
  })

  /*
  it('sum', () => {
    const A = make((S) => S.type({ _tag: S.literal('A'), a: S.string }))
    const B = make((S) => S.type({ _tag: S.literal('B'), b: S.number }))
    check(make((S) => S.sum('_tag')({ A: A(S), B: B(S) })))
  })

  it('lazy', () => {
    interface A {
      a: string
      b?: A
      c?: number
    }

    const schema: Schema<A> = make((S) =>
      S.lazy('A', () => pipe(S.type({ a: S.string }), S.intersect(S.partial({ b: schema(S), c: S.number }))))
    )
    check(schema)
  })
  */
})
