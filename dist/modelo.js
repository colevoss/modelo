"use strict";
/*
  Based on Base.js 1.1a (c) 2006-2010, Dean Edwards
  Updated to pass JSHint and converted into a module by Kenneth Powers
  License: http://www.opensource.org/licenses/mit-license.php
*/
var Base = function () {};

// Implementation
Base.extend = function (_instance, _static) { // subclass
  var extend = Base.prototype.extend;
  // build the prototype
  Base._prototyping = true;
  var proto = new this();
  extend.call(proto, _instance);
  proto.base = function () {
    // call this method from any other method to invoke that method's ancestor
  };
  delete Base._prototyping;
  // create the wrapper for the constructor function
  //var constructor = proto.constructor.valueOf(); //-dean
  var constructor = proto.constructor;
  var klass = proto.constructor = function () {
      if (!Base._prototyping) {
        if (this._constructing || this.constructor === klass) { // instantiation
          this._constructing = true;
          constructor.apply(this, arguments);
          delete this._constructing;
        } else if (arguments[0] !== null) { // casting
          return (arguments[0].extend || extend).call(arguments[0], proto);
        }
      }
    };
  // build the class interface
  klass.ancestor = this;
  klass.extend = this.extend;
  klass.forEach = this.forEach;
  klass.implement = this.implement;
  klass.prototype = proto;
  klass.toString = this.toString;
  klass.valueOf = function (type) {
    return (type === 'object') ? klass : constructor.valueOf();
  };
  extend.call(klass, _static);
  // class initialization
  if (typeof klass.init === 'function') {klass.init();}
  return klass;
};

Base.prototype = {
  extend: function (source, value) {
    if (arguments.length > 1) { // extending with a name/value pair
      var ancestor = this[source];
      if (ancestor && (typeof value === 'function') && // overriding a method?
      // the valueOf() comparison is to avoid circular references
      (!ancestor.valueOf || ancestor.valueOf() !== value.valueOf()) && /\bbase\b/.test(value)) {
        // get the underlying method
        var method = value.valueOf();
        // override
        value = function () {
          var previous = this.base || Base.prototype.base;
          this.base = ancestor;
          var returnValue = method.apply(this, arguments);
          this.base = previous;
          return returnValue;
        };
        // point to the underlying method
        value.valueOf = function (type) {
          return (type === 'object') ? value : method;
        };
        value.toString = Base.toString;
      }
      this[source] = value;
    } else if (source) { // extending with an object literal
      var extend = Base.prototype.extend;
      // if this object has a customized extend method then use it
      if (!Base._prototyping && typeof this !== 'function') {
        extend = this.extend || extend;
      }
      var proto = {
        toSource: null
      };
      // do the "toString" and other methods manually
      var hidden = ['constructor', 'toString', 'valueOf'];
      // if we are prototyping then include the constructor
      for (var i = Base._prototyping ? 0 : 1; i < hidden.length; i++) {
        var h = hidden[i];
        if (source[h] !== proto[h]) {
          extend.call(this, h, source[h]);
        }
      }
      // copy each of the source object's properties to this object
      for (var key in source) {
        if (!proto[key]) {extend.call(this, key, source[key]);}
      }
    }
    return this;
  }
};

// initialize
Base = Base.extend({
  constructor: function () {
    this.extend(arguments[0]);
  }
}, {
  ancestor: Object,
  version: '1.1',
  forEach: function (object, block, context) {
    for (var key in object) {
      if (this.prototype[key] === undefined) {
        block.call(context, object[key], key, object);
      }
    }
  },
  implement: function () {
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] === 'function') {
        // if it's a function, call it
        arguments[i](this.prototype);
      } else {
        // add the interface using the extend method
        this.prototype.extend(arguments[i]);
      }
    }
    return this;
  },
  toString: function () {
    return String(this.valueOf());
  }
});
(function(root, Base, undefined) {


/* modelo main */

// Base function.
var modelo = Base.extend({
  _data: {},            // What actually holds all the data
  validation: {},       // Object full of validation parameters
  beforeSet: undefined, // Called before a value is set
  afterSet: undefined,  // Called after a value is set
  beforeGet: undefined, // Called before a value is gotten
  route: undefined,
  template: '',  // Template to be used for this model

  /*
   * @params {Object} data - data to be put into this._data
   */
  constructor: function(data) {
    for (var k in data){
      this._data[k] = data[k];
      this.defineProps(k);
    }

  },


  /*
   * @params {String} key - property to define
   */
  defineProps: function(key) {
    var data = this._data;
    var _this = this;

    Object.defineProperty(this, key, {
      get: function(){

        if(_this.beforeGet){
          _this.beforeGet({
            key: key,
            value: data[key],
            model: _this
          });
        }

        return data[key];

      },

      set: function(val) {
        var valid;

        valid = _this.checkValidation(key, val);

        if(valid.length){
          return;

        } else {
          if(_this.beforeSet){
            _this.beforeSet({
              key: key,
              value: data[key],
              model: _this
            });
          }

          data[key] = val;

          if(_this.afterSet){
            _this.afterSet({
              key: key,
              value: data[key],
              model: _this
            });
          }

          return val;
        }

      }
    });
  },


  // @method checkValidation
  //  Checks for each type of validation
  //
  checkValidation: function(key, value){
    // Return empty array if validations isn't set on model
    // or if there is no validation for this key
    if(!this.validations || typeof(this.validations[key]) === 'undefined'){return [];}
    var validation, errors, error;

    errors = []; // returned object containing validation errors
    validation = this.validations[key];

    for(var check in validation){
      switch(check){
        // Checks type of value
        case 'type':
          if(typeof(value) !== validation[check]){

            errors.push({
              type: 'type',
              error: '' + value + ' is not of type ' + validation[check],
              expected: validation[check],
              received: typeof(value)
            });

          }
          break;

        // compares value to regex
        case 'match':
          if(!validation[check].test(value)){

            errors.push({
              type: 'match',
              error: '' + value + ' does not match provided RegExp of ' + validation[check]
            });

          }
          break;
      }

    }

    // If there were any validation errors and
    // if a fail callback has been provided then call it
    if(validation.fail && errors.length) {
      validation.fail(errors);
    }

    return errors;
  },


  /*
   * @method processRoute
   *  uses this.route and replaces all parameters prefaced with ':'
   *  with the corresponding value of that instance
   *
   *  @example
   *    person = {id: 1, name: 'Bob'}
   *    route = '/people/:id/name/:name'
   *    returns '/people/1/name/Bob'
   */
  processRoute: function() {
    var _this = this;
    var route = this.route.replace(/:\w+(?=\/|$)/g, function(param) {
      return _this[param.substring(1)];
    });

    return route;
  },


  renderTemplate: function() {
    var template = this.template;
    if (template === ''){return false;}
    if (typeof(template) === 'function') {
      template = template(this._data);
    }

    return this._domMaker(template);
  },

  /*
   * @method each
   * Custom loop to iterate over _data in object using custom setters and getters
   *
   * @params {Function} cb - function to be called for each item
   *   passes key and value of each item in this._data
   */
  each: function(cb) {
    for (var k in this._data) {
      cb(k, this[k]);
    }
  },

  _domMaker: function(domString) {
    var firstElRe, matches, attributes, attrValue, newElement, endTagRe, tagName;

    // RegExp to find the parent tag of the string
    firstElRe = new RegExp(/<[\w\s="'-]+>/);

    domString.replace(firstElRe, ''); // Don't know what this is doing

    // Finds parent element
    matches = domString.match(firstElRe);

    // Gets the tag name from the parent element
    tagName = matches[0].match(/<(\w+)/)[1];

    // Creates array of all attributes and their values in the parent element
    attributes = matches[0].match(/[\w-]+=['"][\w\s-]*["']/g);

    // empty array if no attributes
    if(!attributes){attributes = [];}

    // New HTMLDomElement for tagName
    newElement = document.createElement(tagName);

    // Loop through each attributes and assign it to the new element accordingly
    for (var i = 0; i < attributes.length; i++) {
      attrValue = attributes[i].split('=');
      switch (attrValue[0]) {
         case 'class':
            if (attrValue.length > 1) {
              newElement.className = attrValue[1].replace(/['"]/g, '');
            }
            break;

         case 'id':
            if (attrValue.length > 1) {
              newElement.id = attrValue[1].replace(/["']/g, '');
            }
            break;

         default:
            newElement.setAttribute(
            attrValue[0],
            attrValue.length > 1 ? attrValue[1].replace(/['"]/g, '') : '');
      }
    }

    // Remove the parent element from the dom string to prepare for innerHTML injection
    domString = domString.replace(firstElRe, '');

    // Remove the parent element closing tag from the string to prepare for innerHTML injection
    endTagRe = new RegExp('<\/' + newElement.tagName.toLocaleLowerCase() + '>$');
    domString = domString.replace(endTagRe, '');

    // Add the rest of the html string into the new tag
    newElement.innerHTML = domString;

    return newElement;
  }

});


// Version.
modelo.VERSION = '0.0.0';


// Export to the root, which is probably `window`.
root.Modelo = modelo;


}(this, Base));
