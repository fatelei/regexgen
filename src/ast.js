const jsesc = require('jsesc');
const regenerate = require('regenerate');

/**
 * Represents an alternation (e.g. `foo|bar`)
 */
class Alternation {
  constructor(a, b) {
    this.precedence = 1;
    this.a = a;
    this.b = b;
  }

  toString() {
    return parens(this.a, this) + '|' + parens(this.b, this);
  }
}

/**
 * Represents a character class (e.g. [0-9a-z])
 */
class CharClass {
  constructor(a, b) {
    this.precedence = 2;
    this.set = regenerate(a, b);
    this.isSingleCharacter = true;
  }

  toString() {
    return this.set.toString();
  }

  getCharClass() {
    return this.set;
  }
}

/**
 * Represents a concatenation (e.g. `foo`)
 */
class Concatenation {
  constructor(a, b) {
    this.precedence = 2;
    this.a = a;
    this.b = b;
  }

  toString() {
    return parens(this.a, this) + parens(this.b, this);
  }

  getLiteral(side) {
    if (side === 'start' && this.a instanceof Literal) {
      return this.a;
    }

    if (side === 'end' && this.b instanceof Literal) {
      return this.b;
    }
  }

  simplify() {
    if (this.a.isEmpty) {
      return this.b;
    }

    if (this.b.isEmpty) {
      return this.a;
    }

    return this;
  }
}

/**
 * Represents a repetition (e.g. `a*` or `a?`)
 */
class Repetition {
  constructor(expr, type) {
    this.precedence = 3;
    this.expr = expr;
    this.type = type;
  }

  toString() {
    return parens(this.expr, this) + this.type;
  }
}

/**
 * Represents a literal (e.g. a string)
 */
class Literal {
  constructor(value) {
    this.precedence = 2;
    this.value = value;
  }

  get isEmpty() {
    return !this.value;
  }

  get isSingleCharacter() {
    return Array.from(this.value).length === 1;
  }

  toString() {
    return jsesc(this.value).replace(/([\t\n\f\r\$\(\)\*\+\-\.\?\[\]\^\{\|\}])/g, '\\$1');
  }

  getCharClass() {
    if (this.isSingleCharacter) {
      return this.value;
    }
  }

  getLiteral() {
    return this;
  }
}

function parens(exp, parent) {
  let str = exp.toString();
  if (exp.precedence < parent.precedence && !exp.isSingleCharacter) {
    return '(?:' + str + ')';
  }

  return str;
}

exports.Alternation = Alternation;
exports.CharClass = CharClass;
exports.Concatenation = Concatenation;
exports.Repetition = Repetition;
exports.Literal = Literal;
