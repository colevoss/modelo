# Modelo

Easy to use js models for web apps

## About

A JavaScript library by Cole Voss.

## Installation

Using Bower:

    bower install modelo

Or grab the [source](https://github.com/colevoss/modelo/dist/modelo.js) ([minified](https://github.com/colevoss/modelo/dist/modelo.min.js)).

## Usage

Basic usage is as follows:

```javascript
var Person = Modelo.extend({
  constructor: function(data) {
    this.base(data); // required to call parent class constructor
  },

  route: '/people/:id/:name/:occupation',

  template: '<div class="this is a class" id="id-thing" data-something-else><span>HEY THERE</span></div>',

  beforeGet: function(data) {
    console.log(data); // This happens before a property is gotten
  },

  beforeSet: function(data) {
    console.log(data); // This happens before a property is set
  },

  afterSet: function(data) {
    console.log(data); // This happens after a property is set
  },

  // These validate the value of each property to the the following conditions
  validations: {
    name: {
      type: 'string',
      match: /^C/,
      fail: function(err) {
        console.log(err);
      }
    },

    occupation: {
      type: 'string',
      fail: function(err) {
        console.log(err);
      }
    }
  }

});

cole = new Person({id: 1, name: 'Cole', occupation: 'Code Ninja'});
```

For advanced usage, see the documentation.

## Documentation

Start with `docs/MAIN.md`.

## Contributing

We'll check out your contribution if you:

* Provide a comprehensive suite of tests for your fork.
* Have a clear and documented rationale for your changes.
* Package these up in a pull request.

We'll do our best to help you out with any contribution issues you may have.

## License

MIT. See `LICENSE.txt` in this directory.
