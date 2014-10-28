var people_data = [
  {name: 'Cole Voss', occupation: 'Web Dev'},
  {name: 'Blaine', occupation: 'Web Dev'},
  {name: 'Mike', occupation: 'Lead Dev'}
];


var Person = Modelo.extend({

  constructor: function(data) {
    this.base(data);
  },

  template: function(data) {
    var dom = '<li>' + data.name + '</li>';
    return dom;
  }

});

var people = [];

for (var i = 0; i < people_data.length; i++) {

  var new_person = new Person(people_data[i]);
  console.log(new_person._data);
  people.push(new_person);

}

var container = document.querySelector('.demo-container');
console.log(container);

for (var i = 0; i < people.length; i++) {
  console.log(people[i].renderTemplate());
  container.appendChild(people[i].renderTemplate());
}
