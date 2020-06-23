import * as assert from 'assert'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import * as D from '../src/Decoder'

describe('Decoder', () => {
  it('of', () => {
    const decoder = D.of(1)
    assert.deepStrictEqual(decoder.decode('aaa'), E.right(1))
  })

  describe('functorDecoder', () => {
    it('map', () => {
      const decoder = pipe(
        D.string,
        D.map((s) => s.length)
      )
      assert.deepStrictEqual(decoder.decode(null), E.left([D.tree('cannot decode null, should be string')]))
      assert.deepStrictEqual(decoder.decode('aaa'), E.right(3))
    })
  })

  describe('altDecoder', () => {
    it('alt', () => {
      const decoder = pipe(
        D.string,
        D.alt(() => pipe(D.number, D.map(String)))
      )
      assert.deepStrictEqual(decoder.decode('a'), E.right('a'))
      assert.deepStrictEqual(decoder.decode(1), E.right('1'))
    })
  })

  describe('union', () => {
    it('should decode a valid input', () => {
      assert.deepStrictEqual(D.union(D.string).decode('a'), E.right('a'))
      const decoder = D.union(D.string, D.number)
      assert.deepStrictEqual(decoder.decode('a'), E.right('a'))
      assert.deepStrictEqual(decoder.decode(1), E.right(1))
    })

    it('should reject an invalid input', () => {
      const decoder = D.union(D.string, D.number)
      assert.deepStrictEqual(
        decoder.decode(true),
        E.left([
          D.tree('member 0', [D.tree('cannot decode true, should be string')]),
          D.tree('member 1', [D.tree('cannot decode true, should be number')])
        ])
      )
    })
  })

  describe('sum', () => {
    it('should support non-`string` tag values', () => {
      const decoder = D.sum('_tag')({
        true: D.type({ _tag: D.literal(true), a: D.string }),
        false: D.type({ _tag: D.literal(false), b: D.number })
      })
      assert.deepStrictEqual(decoder.decode({ _tag: true, a: 'a' }), E.right({ _tag: true, a: 'a' }))
      assert.deepStrictEqual(decoder.decode({ _tag: false, b: 1 }), E.right({ _tag: false, b: 1 }))
      assert.deepStrictEqual(
        decoder.decode({ _tag: false, b: 'a' }),
        E.left([D.tree('required property "b"', [D.tree('cannot decode "a", should be number')])])
      )
    })
  })

  describe('intersect', () => {
    it('should accumulate all errors', () => {
      const decoder = pipe(D.type({ a: D.string }), D.intersect(D.type({ b: D.number })))
      assert.deepStrictEqual(
        decoder.decode({}),
        E.left([
          D.tree('required property "a"', [D.tree('cannot decode undefined, should be string')]),
          D.tree('required property "b"', [D.tree('cannot decode undefined, should be number')])
        ])
      )
      assert.deepStrictEqual(
        decoder.decode({ b: 1 }),
        E.left([D.tree('required property "a"', [D.tree('cannot decode undefined, should be string')])])
      )
      assert.deepStrictEqual(
        decoder.decode({ a: 'a' }),
        E.left([D.tree('required property "b"', [D.tree('cannot decode undefined, should be number')])])
      )
    })
  })

  describe('intersect_', () => {
    it('should concat strings', () => {
      assert.deepStrictEqual(D.intersect_('a', 'b'), 'b')
    })

    it('should concat numbers', () => {
      assert.deepStrictEqual(D.intersect_(1, 2), 2)
    })

    it('should concat booleans', () => {
      assert.deepStrictEqual(D.intersect_(true, false), false)
    })

    it('should concat nulls', () => {
      assert.deepStrictEqual(D.intersect_(null, null), null)
    })

    it('should concat undefineds', () => {
      assert.deepStrictEqual(D.intersect_(undefined, undefined), undefined)
    })

    it('should concat objects', () => {
      assert.deepStrictEqual(D.intersect_({ a: 1 }, { b: 2 }), { a: 1, b: 2 })
    })

    it('should concat a string with an object', () => {
      assert.deepStrictEqual(D.intersect_('a', { a: 1 }), { 0: 'a', a: 1 })
    })

    it('should concat a number with an object', () => {
      assert.deepStrictEqual(D.intersect_(1, { a: 1 }), { a: 1 })
    })

    it('should concat a boolean with an object', () => {
      assert.deepStrictEqual(D.intersect_(true, { a: 1 }), { a: 1 })
    })
  })

  describe('draw', () => {
    it('should draw a tree', () => {
      const codec = D.type({
        a: D.string
      })
      assert.deepStrictEqual(pipe(codec.decode({ a: 'a' }), E.mapLeft(D.draw)), E.right({ a: 'a' }))
      assert.deepStrictEqual(
        pipe(codec.decode({ a: 1 }), E.mapLeft(D.draw)),
        E.left(`required property "a"
└─ cannot decode 1, should be string`)
      )
    })
  })
})
