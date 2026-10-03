import { describe, it, expect } from 'vitest';
import {
  redactFields,
  isSensitive,
  createRedactor,
  autoRedact,
  createRedactingReplacer,
  stringifyWithRedaction,
} from '../../../src/utils/redact.js';

describe('redact', () => {
  describe('redactFields', () => {
    it('should redact specified fields', () => {
      const obj = { password: 'secret', username: 'john' };
      const result = redactFields(obj, ['password']);
      expect(result.password).toBe('[REDACTED]');
      expect(result.username).toBe('john');
    });

    it('should redact nested fields with dot notation', () => {
      const obj = {
        user: { password: 'secret', name: 'john' },
        data: { apiKey: 'abc123' }
      };
      const result = redactFields(obj, ['user.password', 'data.apiKey']);
      expect(result.user.password).toBe('[REDACTED]');
      expect(result.user.name).toBe('john');
      expect(result.data.apiKey).toBe('[REDACTED]');
    });

    it('should handle null and undefined', () => {
      expect(redactFields(null as unknown as Record<string, unknown>, ['password'])).toBe(null);
      expect(redactFields(undefined as unknown as Record<string, unknown>, ['password'])).toBe(undefined);
    });

    it('should handle empty field list', () => {
      const obj = { password: 'secret' };
      const result = redactFields(obj, []);
      expect(result.password).toBe('secret');
    });

    it('should handle deeply nested structures', () => {
      const obj = {
        a: { b: { c: { password: 'secret' } } }
      };
      const result = redactFields(obj, ['a.b.c.password']);
      expect(result.a.b.c.password).toBe('[REDACTED]');
    });

    it('should handle wildcard at terminal position', () => {
      const obj = {
        users: { john: 'password1', jane: 'password2' }
      };
      const result = redactFields(obj, ['users.*']);
      expect(result.users.john).toBe('[REDACTED]');
      expect(result.users.jane).toBe('[REDACTED]');
    });

    it('should handle wildcard at intermediate position', () => {
      const obj = {
        data: {
          a: { secret: 'val1' },
          b: { secret: 'val2' }
        }
      };
      const result = redactFields(obj, ['data.*.secret']);
      expect(result.data.a.secret).toBe('[REDACTED]');
      expect(result.data.b.secret).toBe('[REDACTED]');
    });

    it('should handle wildcard with non-object nested value', () => {
      const obj = {
        items: { a: 'string', b: 123 }
      };
      const result = redactFields(obj, ['items.*.nested']);
      // Non-objects should be skipped
      expect(result.items.a).toBe('string');
      expect(result.items.b).toBe(123);
    });

    it('should handle array index notation [*]', () => {
      const arr = [{ secret: 'a' }, { secret: 'b' }];
      const obj = { items: arr };
      const result = redactFields(obj, ['items.[*].secret']);
      expect(result.items[0].secret).toBe('[REDACTED]');
      expect(result.items[1].secret).toBe('[REDACTED]');
    });

    it('should handle array index notation at terminal', () => {
      const obj = { values: ['secret1', 'secret2', 'secret3'] };
      const result = redactFields(obj, ['values.[*]']);
      expect(result.values[0]).toBe('[REDACTED]');
      expect(result.values[1]).toBe('[REDACTED]');
      expect(result.values[2]).toBe('[REDACTED]');
    });

    it('should handle array index with non-object elements', () => {
      const obj = { items: ['a', 'b', 'c'] };
      const result = redactFields(obj, ['items.[*].nested']);
      // Non-objects should be skipped
      expect(result.items[0]).toBe('a');
      expect(result.items[1]).toBe('b');
    });

    it('should skip [*] on non-array', () => {
      const obj = { notArray: { a: 1 } };
      const result = redactFields(obj, ['notArray.[*]']);
      expect(result.notArray.a).toBe(1);
    });

    it('should handle path not found', () => {
      const obj = { a: 1 };
      const result = redactFields(obj, ['nonexistent.path']);
      expect(result.a).toBe(1);
    });

    it('should handle deep clone of Date', () => {
      const date = new Date('2024-01-01');
      const obj = { createdAt: date, password: 'secret' };
      const result = redactFields(obj, ['password']);
      expect(result.createdAt).toEqual(date);
      expect(result.createdAt).not.toBe(date);
    });

    it('should handle deep clone of RegExp', () => {
      const regex = /test/gi;
      const obj = { pattern: regex, password: 'secret' };
      const result = redactFields(obj, ['password']);
      expect(result.pattern.source).toBe(regex.source);
      expect(result.pattern.flags).toBe(regex.flags);
    });

    it('should handle deep clone of Map', () => {
      const map = new Map([['key', 'value']]);
      const obj = { data: map, password: 'secret' };
      const result = redactFields(obj, ['password']);
      expect(result.data.get('key')).toBe('value');
    });

    it('should handle deep clone of Set', () => {
      const set = new Set(['a', 'b']);
      const obj = { items: set, password: 'secret' };
      const result = redactFields(obj, ['password']);
      expect(result.items.has('a')).toBe(true);
      expect(result.items.has('b')).toBe(true);
    });

    it('should handle arrays in object', () => {
      const obj = { list: [1, 2, 3], password: 'secret' };
      const result = redactFields(obj, ['password']);
      expect(result.list).toEqual([1, 2, 3]);
    });

    it('should handle empty path part', () => {
      const obj = { a: { b: 'value' } };
      const result = redactFields(obj, ['a..b']);
      // Empty path part should stop traversal
      expect(result.a.b).toBe('value');
    });

    it('should continue traversal when value is object', () => {
      const obj = { a: { b: { c: 'secret' } } };
      const result = redactFields(obj, ['a.b.c']);
      expect(result.a.b.c).toBe('[REDACTED]');
    });

    it('should not traverse non-object values', () => {
      const obj = { a: 'string' };
      const result = redactFields(obj, ['a.b.c']);
      expect(result.a).toBe('string');
    });
  });

  describe('isSensitive', () => {
    const defaultPatterns = ['password', 'secret', 'token', 'apiKey'];

    it('should detect password fields', () => {
      expect(isSensitive('password', defaultPatterns)).toBe(true);
    });

    it('should detect secret fields', () => {
      expect(isSensitive('secret', defaultPatterns)).toBe(true);
    });

    it('should detect token fields', () => {
      expect(isSensitive('token', defaultPatterns)).toBe(true);
    });

    it('should not flag regular fields', () => {
      expect(isSensitive('username', defaultPatterns)).toBe(false);
      expect(isSensitive('email', defaultPatterns)).toBe(false);
    });

    it('should detect fields containing pattern', () => {
      expect(isSensitive('userPassword', defaultPatterns)).toBe(true);
      expect(isSensitive('api_token', defaultPatterns)).toBe(true);
    });
  });

  describe('createRedactor', () => {
    it('should create a redactor function', () => {
      const redact = createRedactor(['password']);
      expect(typeof redact).toBe('function');
    });

    it('should redact using the redactor', () => {
      const redact = createRedactor(['password']);
      const obj = { password: 'secret' };
      const result = redact(obj);
      expect(result.password).toBe('[REDACTED]');
    });
  });

  describe('autoRedact', () => {
    it('should automatically detect and redact sensitive fields', () => {
      const obj = { password: 'secret', username: 'john' };
      const result = autoRedact(obj);
      expect(result.password).toBe('[REDACTED]');
      expect(result.username).toBe('john');
    });

    it('should detect common sensitive patterns', () => {
      const obj = { apiKey: '123', token: 'abc' };
      const result = autoRedact(obj);
      expect(result.apiKey).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
    });
  });

  describe('circular references', () => {
    it('should not overflow the stack on a self-referencing entry', () => {
      const entry: Record<string, unknown> = { msg: 'failed', err: { message: 'boom' } };
      (entry.err as Record<string, unknown>).context = entry;

      const result = redactFields(entry, ['password']);
      expect((result.err as Record<string, unknown>).context).toBe('[Circular]');
    });

    it('should handle a root self-reference', () => {
      const obj: Record<string, unknown> = { name: 'x' };
      obj.self = obj;
      expect(redactFields(obj, ['password']).self).toBe('[Circular]');
    });

    it('should handle mutually circular objects', () => {
      const a: Record<string, unknown> = { id: 'a' };
      const b: Record<string, unknown> = { id: 'b', a };
      a.b = b;
      expect((redactFields(a, ['password']).b as Record<string, unknown>).a).toBe('[Circular]');
    });

    it('should handle a circular array', () => {
      const list: unknown[] = [1, 2];
      list.push(list);
      expect(redactFields({ list }, ['password']).list[2]).toBe('[Circular]');
    });

    it('should clone a shared reference once per branch', () => {
      const shared = { keep: 1 };
      const result = redactFields({ x: shared, y: shared }, ['password']);
      expect(result.x).not.toBe(result.y);
      expect(result.x.keep).toBe(1);
      expect(result.y.keep).toBe(1);
    });

    it('should still redact acyclic entries', () => {
      const result = redactFields(
        { user: { name: 'a', password: 'p' }, rows: [{ token: 't' }] },
        ['user.password', 'rows.[*].token']
      );
      expect(result.user.password).toBe('[REDACTED]');
      expect(result.rows[0].token).toBe('[REDACTED]');
      expect(result.user.name).toBe('a');
    });
  });

  describe('stringifyWithRedaction', () => {
    it('should redact flat fields', () => {
      expect(JSON.parse(stringifyWithRedaction({ password: 'p', user: 'a' }, ['password']))).toEqual({
        password: '[REDACTED]',
        user: 'a',
      });
    });

    it('should redact dotted paths', () => {
      const result = JSON.parse(
        stringifyWithRedaction(
          { headers: { authorization: 'Bearer x', 'x-trace': 'ok' } },
          ['headers.authorization']
        )
      );
      expect(result.headers.authorization).toBe('[REDACTED]');
      expect(result.headers['x-trace']).toBe('ok');
    });

    it('should redact wildcard paths, including array entries', () => {
      const result = JSON.parse(
        stringifyWithRedaction(
          { items: [{ token: 'a' }, { token: 'b' }], other: { token: 'c' } },
          ['items.*.token']
        )
      );
      expect(result.items[0].token).toBe('[REDACTED]');
      expect(result.items[1].token).toBe('[REDACTED]');
      expect(result.other.token).toBe('c');
    });

    it('should redact array index notation', () => {
      const result = JSON.parse(
        stringifyWithRedaction({ rows: [{ secret: 'a' }, { secret: 'b' }] }, ['rows.[*].secret'])
      );
      expect(result.rows[0].secret).toBe('[REDACTED]');
      expect(result.rows[1].secret).toBe('[REDACTED]');
    });

    it('should fall back to plain stringify without paths', () => {
      expect(stringifyWithRedaction({ password: 'p' }, [])).toBe('{"password":"p"}');
    });

    it('should leave unknown paths untouched', () => {
      expect(stringifyWithRedaction({ a: 1 }, ['nope.deep.path'])).toBe('{"a":1}');
    });

    it('should mark true cycles as circular', () => {
      const selfish: Record<string, unknown> = { name: 'x' };
      selfish.self = selfish;
      expect(stringifyWithRedaction(selfish, ['password'])).toContain('[Circular]');
    });

    it('should preserve a shared reference', () => {
      const user = { id: 1, name: 'alice' };
      const result = JSON.parse(stringifyWithRedaction({ owner: user, viewer: user }, ['password']));
      expect(result.viewer.name).toBe('alice');
    });
  });

  describe('createRedactingReplacer', () => {
    it('should match wildcard paths against the real path only', () => {
      const replacer = createRedactingReplacer(['user.*.pin']);
      const result = JSON.parse(
        JSON.stringify(
          {
            user: { id: 1, pin: 'REAL' },
            userId: { pin: 'UNRELATED' },
            other: { deep: { pin: 'UNRELATED' } },
          },
          replacer
        )
      );
      expect(result.user.pin).toBe('[REDACTED]');
      expect(result.userId.pin).toBe('UNRELATED');
      expect(result.other.deep.pin).toBe('UNRELATED');
    });

    it('should redact exact names at any depth', () => {
      const result = JSON.parse(
        JSON.stringify({ deep: { password: 'p' }, password: 'p' }, createRedactingReplacer(['password']))
      );
      expect(result.deep.password).toBe('[REDACTED]');
      expect(result.password).toBe('[REDACTED]');
    });

    it('should redact dotted paths', () => {
      const result = JSON.parse(
        JSON.stringify({ headers: { authorization: 'a' } }, createRedactingReplacer(['headers.authorization']))
      );
      expect(result.headers.authorization).toBe('[REDACTED]');
    });

    it('should be reusable across serializations', () => {
      const replacer = createRedactingReplacer(['user.*.pin']);
      const first = JSON.parse(JSON.stringify({ user: { pin: '1' } }, replacer));
      // A later serialization must not inherit state from the first one.
      const second = JSON.parse(JSON.stringify({ userId: { pin: '3' } }, replacer));
      expect(first.user.pin).toBe('[REDACTED]');
      expect(second.userId.pin).toBe('3');
    });
  });
});
