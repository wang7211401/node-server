class Person{
  constructor(name,age){
    this.name = name;
    this.age = age
  }
  walk(){
    console.log(this.name)
  }
}
var p1 = new Person('frank',18)
console.log(p1)
