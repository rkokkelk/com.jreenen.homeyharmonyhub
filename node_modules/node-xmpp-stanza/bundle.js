(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.stanza = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

var ltx = require('ltx')

module.exports.IQ = require('./lib/IQ')
module.exports.Message = require('./lib/Message')
module.exports.Presence = require('./lib/Presence')

module.exports.Stanza = require('./lib/Stanza')
module.exports.createStanza = require('./lib/createStanza')

module.exports.parse = require('./lib/parse')
module.exports.Parser = require('./lib/Parser')

module.exports.Element = ltx.Element
module.exports.createElement = ltx.createElement

module.exports.escapeXML = ltx.escapeXML
module.exports.escapeXMLText = ltx.escapeXMLText

module.exports.equal = ltx.equal
module.exports.nameEqual = ltx.nameEqual
module.exports.attrsEqual = ltx.attrsEqual
module.exports.childrenEqual = ltx.childrenEqual

module.exports.ltx = ltx

},{"./lib/IQ":2,"./lib/Message":3,"./lib/Parser":4,"./lib/Presence":5,"./lib/Stanza":6,"./lib/createStanza":7,"./lib/parse":8,"ltx":10}],2:[function(require,module,exports){
'use strict'

var Stanza = require('./Stanza')
var inherits = require('inherits')

function IQ (attrs) {
  Stanza.call(this, 'iq', attrs)
}

inherits(IQ, Stanza)

module.exports = IQ

},{"./Stanza":6,"inherits":9}],3:[function(require,module,exports){
'use strict'

var Stanza = require('./Stanza')
var inherits = require('inherits')

function Message (attrs) {
  Stanza.call(this, 'message', attrs)
}

inherits(Message, Stanza)

module.exports = Message

},{"./Stanza":6,"inherits":9}],4:[function(require,module,exports){
'use strict'

var inherits = require('inherits')
var createStanza = require('./createStanza')
var LtxParser = require('ltx').Parser

function Parser (options) {
  LtxParser.call(this, options)
}
inherits(Parser, LtxParser)

Parser.prototype.DefaultElement = createStanza

module.exports = Parser

},{"./createStanza":7,"inherits":9,"ltx":10}],5:[function(require,module,exports){
'use strict'

var Stanza = require('./Stanza')
var inherits = require('inherits')

function Presence (attrs) {
  Stanza.call(this, 'presence', attrs)
}

inherits(Presence, Stanza)

module.exports = Presence

},{"./Stanza":6,"inherits":9}],6:[function(require,module,exports){
'use strict'

var inherits = require('inherits')
var Element = require('ltx').Element

function Stanza (name, attrs) {
  Element.call(this, name, attrs)
}

inherits(Stanza, Element)

Stanza.prototype.clone = function () {
  var clone = new Stanza(this.name, {})
  for (var k in this.attrs) {
    if (this.attrs.hasOwnProperty(k)) {
      clone.attrs[k] = this.attrs[k]
    }
  }
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    clone.cnode(child.clone ? child.clone() : child)
  }
  return clone
}

/**
 * Common attribute getters/setters to all stanzas
 * http://xmpp.org/rfcs/rfc6120.html#stanzas-attributes
 */

Object.defineProperty(Stanza.prototype, 'from', {
  get: function () {
    return this.attrs.from
  },
  set: function (from) {
    this.attrs.from = from
  }
})

Object.defineProperty(Stanza.prototype, 'to', {
  get: function () {
    return this.attrs.to
  },
  set: function (to) {
    this.attrs.to = to
  }
})

Object.defineProperty(Stanza.prototype, 'id', {
  get: function () {
    return this.attrs.id
  },
  set: function (id) {
    this.attrs.id = id
  }
})

Object.defineProperty(Stanza.prototype, 'type', {
  get: function () {
    return this.attrs.type
  },
  set: function (type) {
    this.attrs.type = type
  }
})

module.exports = Stanza

},{"inherits":9,"ltx":10}],7:[function(require,module,exports){
'use strict'

var Stanza = require('./Stanza')
var Element = require('ltx').Element

module.exports = function createStanza (name, attrs /*, child1, child2, ...*/) {
  var el

  switch (name) {
    case 'presence':
    case 'message':
    case 'iq':
      el = new Stanza(name, attrs)
      break
    default:
      el = new Element(name, attrs)
  }

  var children = Array.prototype.slice.call(arguments, 2)

  children.forEach(function (child) {
    el.cnode(child)
  })
  return el
}

},{"./Stanza":6,"ltx":10}],8:[function(require,module,exports){
'use strict'

var Parser = require('./Parser')
var ltxParse = require('ltx').parse

module.exports = function parse (data) {
  return ltxParse(data, Parser)
}

},{"./Parser":4,"ltx":10}],9:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],10:[function(require,module,exports){
'use strict'

var parse = require('./lib/parse')
var Parser = require('./lib/Parser')
var escape = require('./lib/escape')
var Element = require('./lib/Element')
var equal = require('./lib/equal')
var createElement = require('./lib/createElement')

exports.Element = Element

exports.equal = equal.equal
exports.nameEqual = equal.name
exports.attrsEqual = equal.attrs
exports.childrenEqual = equal.children

exports.createElement = createElement

exports.escapeXML = escape.escapeXML
exports.escapeXMLText = escape.escapeXMLText

exports.Parser = Parser
exports.parse = parse

},{"./lib/Element":11,"./lib/Parser":12,"./lib/createElement":13,"./lib/equal":14,"./lib/escape":15,"./lib/parse":16}],11:[function(require,module,exports){
'use strict'

var escape = require('./escape')
var escapeXML = escape.escapeXML
var escapeXMLText = escape.escapeXMLText

var equality = require('./equal')
var equal = equality.equal
var nameEqual = equality.name
var attrsEqual = equality.attrs
var childrenEqual = equality.children

/**
 * This cheap replica of DOM/Builder puts me to shame :-)
 *
 * Attributes are in the element.attrs object. Children is a list of
 * either other Elements or Strings for text content.
 **/
function Element (name, attrs) {
  this.name = name
  this.parent = null
  this.children = []
  this.setAttrs(attrs)
}

/* Accessors */

/**
 * if (element.is('message', 'jabber:client')) ...
 **/
Element.prototype.is = function (name, xmlns) {
  return (this.getName() === name) &&
  (!xmlns || (this.getNS() === xmlns))
}

/* without prefix */
Element.prototype.getName = function () {
  if (this.name.indexOf(':') >= 0) {
    return this.name.substr(this.name.indexOf(':') + 1)
  } else {
    return this.name
  }
}

/**
 * retrieves the namespace of the current element, upwards recursively
 **/
Element.prototype.getNS = function () {
  if (this.name.indexOf(':') >= 0) {
    var prefix = this.name.substr(0, this.name.indexOf(':'))
    return this.findNS(prefix)
  }
  return this.findNS()
}

/**
 * find the namespace to the given prefix, upwards recursively
 **/
Element.prototype.findNS = function (prefix) {
  if (!prefix) {
    /* default namespace */
    if (this.attrs.xmlns) {
      return this.attrs.xmlns
    } else if (this.parent) {
      return this.parent.findNS()
    }
  } else {
    /* prefixed namespace */
    var attr = 'xmlns:' + prefix
    if (this.attrs[attr]) {
      return this.attrs[attr]
    } else if (this.parent) {
      return this.parent.findNS(prefix)
    }
  }
}

/**
 * Recursiverly gets all xmlns defined, in the form of {url:prefix}
 **/
Element.prototype.getXmlns = function () {
  var namespaces = {}

  if (this.parent) {
    namespaces = this.parent.getXmlns()
  }

  for (var attr in this.attrs) {
    var m = attr.match('xmlns:?(.*)')
    if (this.attrs.hasOwnProperty(attr) && m) {
      namespaces[this.attrs[attr]] = m[1]
    }
  }
  return namespaces
}

Element.prototype.setAttrs = function (attrs) {
  this.attrs = {}

  if (typeof attrs === 'string') {
    this.attrs.xmlns = attrs
  } else if (attrs) {
    Object.keys(attrs).forEach(function (key) {
      this.attrs[key] = attrs[key]
    }, this)
  }
}

/**
 * xmlns can be null, returns the matching attribute.
 **/
Element.prototype.getAttr = function (name, xmlns) {
  if (!xmlns) {
    return this.attrs[name]
  }

  var namespaces = this.getXmlns()

  if (!namespaces[xmlns]) {
    return null
  }

  return this.attrs[[namespaces[xmlns], name].join(':')]
}

/**
 * xmlns can be null
 **/
Element.prototype.getChild = function (name, xmlns) {
  return this.getChildren(name, xmlns)[0]
}

/**
 * xmlns can be null
 **/
Element.prototype.getChildren = function (name, xmlns) {
  var result = []
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if (child.getName &&
      (child.getName() === name) &&
      (!xmlns || (child.getNS() === xmlns))) {
      result.push(child)
    }
  }
  return result
}

/**
 * xmlns and recursive can be null
 **/
Element.prototype.getChildByAttr = function (attr, val, xmlns, recursive) {
  return this.getChildrenByAttr(attr, val, xmlns, recursive)[0]
}

/**
 * xmlns and recursive can be null
 **/
Element.prototype.getChildrenByAttr = function (attr, val, xmlns, recursive) {
  var result = []
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if (child.attrs &&
      (child.attrs[attr] === val) &&
      (!xmlns || (child.getNS() === xmlns))) {
      result.push(child)
    }
    if (recursive && child.getChildrenByAttr) {
      result.push(child.getChildrenByAttr(attr, val, xmlns, true))
    }
  }
  if (recursive) {
    result = [].concat.apply([], result)
  }
  return result
}

Element.prototype.getChildrenByFilter = function (filter, recursive) {
  var result = []
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if (filter(child)) {
      result.push(child)
    }
    if (recursive && child.getChildrenByFilter) {
      result.push(child.getChildrenByFilter(filter, true))
    }
  }
  if (recursive) {
    result = [].concat.apply([], result)
  }
  return result
}

Element.prototype.getText = function () {
  var text = ''
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    if ((typeof child === 'string') || (typeof child === 'number')) {
      text += child
    }
  }
  return text
}

Element.prototype.getChildText = function (name, xmlns) {
  var child = this.getChild(name, xmlns)
  return child ? child.getText() : null
}

/**
 * Return all direct descendents that are Elements.
 * This differs from `getChildren` in that it will exclude text nodes,
 * processing instructions, etc.
 */
Element.prototype.getChildElements = function () {
  return this.getChildrenByFilter(function (child) {
    return child instanceof Element
  })
}

/* Builder */

/** returns uppermost parent */
Element.prototype.root = function () {
  if (this.parent) {
    return this.parent.root()
  }
  return this
}
Element.prototype.tree = Element.prototype.root

/** just parent or itself */
Element.prototype.up = function () {
  if (this.parent) {
    return this.parent
  }
  return this
}

Element.prototype._getElement = function (name, attrs) {
  var element = new Element(name, attrs)
  return element
}

/** create child node and return it */
Element.prototype.c = function (name, attrs) {
  return this.cnode(this._getElement(name, attrs))
}

Element.prototype.cnode = function (child) {
  this.children.push(child)
  if (typeof child === 'object') {
    child.parent = this
  }
  return child
}

/** add text node and return element */
Element.prototype.t = function (text) {
  this.children.push(text)
  return this
}

/* Manipulation */

/**
 * Either:
 *   el.remove(childEl)
 *   el.remove('author', 'urn:...')
 */
Element.prototype.remove = function (el, xmlns) {
  var filter
  if (typeof el === 'string') {
    /* 1st parameter is tag name */
    filter = function (child) {
      return !(child.is &&
      child.is(el, xmlns))
    }
  } else {
    /* 1st parameter is element */
    filter = function (child) {
      return child !== el
    }
  }

  this.children = this.children.filter(filter)

  return this
}

/**
 * To use in case you want the same XML data for separate uses.
 * Please refrain from this practise unless you know what you are
 * doing. Building XML with ltx is easy!
 */
Element.prototype.clone = function () {
  var clone = this._getElement(this.name, this.attrs)
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    clone.cnode(child.clone ? child.clone() : child)
  }
  return clone
}

Element.prototype.text = function (val) {
  if (val && this.children.length === 1) {
    this.children[0] = val
    return this
  }
  return this.getText()
}

Element.prototype.attr = function (attr, val) {
  if (typeof val !== 'undefined' || val === null) {
    if (!this.attrs) {
      this.attrs = {}
    }
    this.attrs[attr] = val
    return this
  }
  return this.attrs[attr]
}

/* Serialization */

Element.prototype.toString = function () {
  var s = ''
  this.write(function (c) {
    s += c
  })
  return s
}

Element.prototype.toJSON = function () {
  return {
    name: this.name,
    attrs: this.attrs,
    children: this.children.map(function (child) {
      return child && child.toJSON ? child.toJSON() : child
    })
  }
}

Element.prototype._addChildren = function (writer) {
  writer('>')
  for (var i = 0; i < this.children.length; i++) {
    var child = this.children[i]
    /* Skip null/undefined */
    if (child || (child === 0)) {
      if (child.write) {
        child.write(writer)
      } else if (typeof child === 'string') {
        writer(escapeXMLText(child))
      } else if (child.toString) {
        writer(escapeXMLText(child.toString(10)))
      }
    }
  }
  writer('</')
  writer(this.name)
  writer('>')
}

Element.prototype.write = function (writer) {
  writer('<')
  writer(this.name)
  for (var k in this.attrs) {
    var v = this.attrs[k]
    if (v != null) { // === null || undefined
      writer(' ')
      writer(k)
      writer('="')
      if (typeof v !== 'string') {
        v = v.toString()
      }
      writer(escapeXML(v))
      writer('"')
    }
  }
  if (this.children.length === 0) {
    writer('/>')
  } else {
    this._addChildren(writer)
  }
}

Element.prototype.nameEquals = function (el) {
  return nameEqual(this, el)
}

Element.prototype.attrsEquals = function (el) {
  return attrsEqual(this, el)
}

Element.prototype.childrenEquals = function (el) {
  return childrenEqual(this, el)
}

Element.prototype.equals = function (el) {
  return equal(this, el)
}

module.exports = Element

},{"./equal":14,"./escape":15}],12:[function(require,module,exports){
'use strict'

var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var Element = require('./Element')
var LtxParser = require('./parsers/ltx')

var Parser = function (options) {
  EventEmitter.call(this)

  var ParserInterface = this.Parser = (options && options.Parser) || this.DefaultParser
  var ElementInterface = this.Element = (options && options.Element) || this.DefaultElement

  this.parser = new ParserInterface()

  var el
  var self = this
  this.parser.on('startElement', function (name, attrs) {
    var child = new ElementInterface(name, attrs)
    if (!el) {
      el = child
    } else {
      el = el.cnode(child)
    }
  })
  this.parser.on('endElement', function (name) {
    if (!el) {
      /* Err */
    } else if (name === el.name) {
      if (el.parent) {
        el = el.parent
      } else if (!self.tree) {
        self.tree = el
        el = undefined
      }
    }
  })
  this.parser.on('text', function (str) {
    if (el) {
      el.t(str)
    }
  })
  this.parser.on('error', function (e) {
    self.error = e
    self.emit('error', e)
  })
}

inherits(Parser, EventEmitter)

Parser.prototype.DefaultParser = LtxParser

Parser.prototype.DefaultElement = Element

Parser.prototype.write = function (data) {
  this.parser.write(data)
}

Parser.prototype.end = function (data) {
  this.parser.end(data)

  if (!this.error) {
    if (this.tree) {
      this.emit('tree', this.tree)
    } else {
      this.emit('error', new Error('Incomplete document'))
    }
  }
}

module.exports = Parser

},{"./Element":11,"./parsers/ltx":17,"events":18,"inherits":9}],13:[function(require,module,exports){
'use strict'

var Element = require('./Element')

module.exports = function createElement (name, attrs /*, child1, child2, ...*/) {
  var el = new Element(name, attrs)

  var children = Array.prototype.slice.call(arguments, 2)

  children.forEach(function (child) {
    el.cnode(child)
  })
  return el
}

},{"./Element":11}],14:[function(require,module,exports){
'use strict'

function nameEqual (a, b) {
  return a.name === b.name
}

function attrsEqual (a, b) {
  var attrs = a.attrs
  var keys = Object.keys(attrs)
  var length = keys.length
  if (length !== Object.keys(b.attrs).length) return false
  for (var i = 0, l = length; i < l; i++) {
    var key = keys[i]
    var value = attrs[key]
    if (value == null || b.attrs[key] == null) { // === null || undefined
      if (value !== b.attrs[key]) return false
    }
    else if (value.toString() !== b.attrs[key].toString()) return false
  }
  return true
}

function childrenEqual (a, b) {
  var children = a.children
  var length = children.length
  if (length !== b.children.length) return false
  for (var i = 0, l = length; i < l; i++) {
    var child = children[i]
    if (typeof child === 'string') {
      if (child !== b.children[i]) return false
    } else {
      if (!child.equals(b.children[i])) return false
    }
  }
  return true
}

function equal (a, b) {
  if (!nameEqual(a, b)) return false
  if (!attrsEqual(a, b)) return false
  if (!childrenEqual(a, b)) return false
  return true
}

module.exports.name = nameEqual
module.exports.attrs = attrsEqual
module.exports.children = childrenEqual
module.exports.equal = equal

},{}],15:[function(require,module,exports){
'use strict'

exports.escapeXML = function escapeXML (s) {
  return s
    .replace(/\&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/"/g, '&apos;')
}

exports.escapeXMLText = function escapeXMLText (s) {
  return s
    .replace(/\&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

},{}],16:[function(require,module,exports){
'use strict'

var Parser = require('./Parser')

module.exports = function parse (data, options) {
  var p
  if (typeof options === 'function') {
    p = new options() // eslint-disable-line
  } else {
    p = new Parser(options)
  }

  var result = null
  var error = null

  p.on('tree', function (tree) {
    result = tree
  })
  p.on('error', function (e) {
    error = e
  })

  p.write(data)
  p.end()

  if (error) {
    throw error
  } else {
    return result
  }
}

},{"./Parser":12}],17:[function(require,module,exports){
'use strict'

var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter

var STATE_TEXT = 0
var STATE_IGNORE_TAG = 1
var STATE_TAG_NAME = 2
var STATE_TAG = 3
var STATE_ATTR_NAME = 4
var STATE_ATTR_EQ = 5
var STATE_ATTR_QUOT = 6
var STATE_ATTR_VALUE = 7

var SaxLtx = module.exports = function SaxLtx () {
  EventEmitter.call(this)

  var state = STATE_TEXT
  var remainder
  var tagName
  var attrs
  var endTag
  var selfClosing
  var attrQuote
  var recordStart = 0
  var attrName

  this._handleTagOpening = function (endTag, tagName, attrs) {
    if (!endTag) {
      this.emit('startElement', tagName, attrs)
      if (selfClosing) {
        this.emit('endElement', tagName)
      }
    } else {
      this.emit('endElement', tagName)
    }
  }

  this.write = function (data) {
    if (typeof data !== 'string') {
      data = data.toString()
    }
    var pos = 0

    /* Anything from previous write()? */
    if (remainder) {
      data = remainder + data
      pos += remainder.length
      remainder = null
    }

    function endRecording () {
      if (typeof recordStart === 'number') {
        var recorded = data.slice(recordStart, pos)
        recordStart = undefined
        return recorded
      }
    }

    for (; pos < data.length; pos++) {
      var c = data.charCodeAt(pos)
      // console.log("state", state, "c", c, data[pos])
      switch (state) {
        case STATE_TEXT:
          if (c === 60 /* < */) {
            var text = endRecording()
            if (text) {
              this.emit('text', unescapeXml(text))
            }
            state = STATE_TAG_NAME
            recordStart = pos + 1
            attrs = {}
          }
          break
        case STATE_TAG_NAME:
          if (c === 47 /* / */ && recordStart === pos) {
            recordStart = pos + 1
            endTag = true
          } else if (c === 33 /* ! */ || c === 63 /* ? */) {
            recordStart = undefined
            state = STATE_IGNORE_TAG
          } else if (c <= 32 || c === 47 /* / */ || c === 62 /* > */) {
            tagName = endRecording()
            pos--
            state = STATE_TAG
          }
          break
        case STATE_IGNORE_TAG:
          if (c === 62 /* > */) {
            state = STATE_TEXT
          }
          break
        case STATE_TAG:
          if (c === 62 /* > */) {
            this._handleTagOpening(endTag, tagName, attrs)
            tagName = undefined
            attrs = undefined
            endTag = undefined
            selfClosing = undefined
            state = STATE_TEXT
            recordStart = pos + 1
          } else if (c === 47 /* / */) {
            selfClosing = true
          } else if (c > 32) {
            recordStart = pos
            state = STATE_ATTR_NAME
          }
          break
        case STATE_ATTR_NAME:
          if (c <= 32 || c === 61 /* = */) {
            attrName = endRecording()
            pos--
            state = STATE_ATTR_EQ
          }
          break
        case STATE_ATTR_EQ:
          if (c === 61 /* = */) {
            state = STATE_ATTR_QUOT
          }
          break
        case STATE_ATTR_QUOT:
          if (c === 34 /* " */ || c === 39 /* ' */) {
            attrQuote = c
            state = STATE_ATTR_VALUE
            recordStart = pos + 1
          }
          break
        case STATE_ATTR_VALUE:
          if (c === attrQuote) {
            var value = unescapeXml(endRecording())
            attrs[attrName] = value
            attrName = undefined
            state = STATE_TAG
          }
          break
      }
    }

    if (typeof recordStart === 'number' &&
      recordStart <= data.length) {
      remainder = data.slice(recordStart)
      recordStart = 0
    }
  }
  /*
  var origEmit = this.emit
  this.emit = function() {
    console.log('ltx', arguments)
    origEmit.apply(this, arguments)
  }
  */
}
inherits(SaxLtx, EventEmitter)

SaxLtx.prototype.end = function (data) {
  if (data) {
    this.write(data)
  }

  /* Uh, yeah */
  this.write = function () {}
}

function unescapeXml (s) {
  return s
    .replace(/\&(amp|#38);/g, '&')
    .replace(/\&(lt|#60);/g, '<')
    .replace(/\&(gt|#62);/g, '>')
    .replace(/\&(quot|#34);/g, '"')
    .replace(/\&(apos|#39);/g, "'")
    .replace(/\&(nbsp|#160);/g, '\n')
}

},{"events":18,"inherits":9}],18:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[1])(1)
});