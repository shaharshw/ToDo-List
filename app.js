//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-shahar:Shahar123@cluster0.n5lp6lf.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});
//mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');

const itemsSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const day = date.getDate();

app.get("/", function(req, res) {

  Item.find({}).then(function(foundItems) {
      res.render("list", { listTitle: day, newListItems: foundItems });
    });
});

app.get("/:listName", function(req, res){
  const listName = _.capitalize(req.params.listName);


  List.findOne({ name: listName}).then(function(foundItem){
    if(foundItem){
      // show an existing list
      res.render("list", {listTitle: foundItem.name, newListItems: foundItem.items});

    } else { 
      // create new list
      const list = new List({
        name: listName,
        items: []
      });
    
      list.save();
      res.redirect("/" + listName);
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName === day){
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName}).then(function(foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    })
  }



});

app.post("/delete", function(req, res){
  const checkItemId = req.body.checkbox;
  const filter = { _id: checkItemId};
  const listName = req.body.listName;

  if(listName === day){
    Item.findOneAndDelete(filter)
    .then(function(deletedItem) {
      if (!deletedItem) {
        console.log("Item not found!");
      } else {
        console.log("Item deleted!");
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkItemId } } })
    .then(function(foundList) {
      if (foundList) {
        res.redirect("/" + listName);
      }
    });
  }


})

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}   
app.listen(port, function() {
  console.log("Server has started");
});
});