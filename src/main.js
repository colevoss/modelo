/* modelo main */

// Base function.
var modelo = Base.extend({
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
    this._data = {};
    this.dom = undefined;
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
    var validation, errors;

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

    this.dom = this._domMaker(template);
    this.bindEvents();
    return this.dom;
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
    var firstElRe, matches, attrString, attributes, attrValue, newElement, endTagRe, tagName;

    // RegExp to find the parent tag of the string
    firstElRe = new RegExp(/<[\w\s="'-]+>/);

    domString.replace(firstElRe, ''); // Don't know what this is doing

    // Finds parent element
    matches = domString.match(firstElRe);

    // Gets the tag name from the parent element
    tagName = matches[0].match(/<(\w+)/)[1];

    attrString = matches[0].replace(/<\w+[\s>]/, '');

    // Creates array of all attributes and their values in the parent element
    attributes = attrString.match(/[\w-]+(?:=['"][\w\s-]*["'])*/g);

    // empty array if no attributes
    if(!attributes){attributes = [];}

    // New HTMLDomElement for tagName
    newElement = root.document.createElement(tagName);

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
  },



  /*
   * Binds events based on this.events object
   *
   */
  bindEvents: function() {
    // {click: {}}
    for (var type in this.events) {

      // {'.class': fn(){}}
      for (var selector in this.events[type]) {
        var elements = this.dom.querySelectorAll(selector);

        for (var _i = 0; _i < elements.length; _i++) {
          var _this = this;

          elements[_i].addEventListener(type, function(e){
            e.data = _this;
            _this.events[type][selector](e);
          }, false);

        }

      }

    }
  }

});


// Version.
modelo.VERSION = '0.0.1';


// Export to the root, which is probably `window`.
root.Modelo = modelo;
