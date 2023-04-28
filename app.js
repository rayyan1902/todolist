//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
mongoose.connect(process.env.MONGO_URL).then(() => console.log("It ran")).catch((err) => console.error(err))


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemsSchema = new mongoose.Schema({
  name: String //this refer to item name
});

const Item = mongoose.model("Item", itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,  //this refer to list name
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);


const item1 = new Item ({
  name: "Welcome to your todoList!"
});

const item2 = new Item ({
  name: "Hit the + button to add new task."
});

const item3 = new Item ({
  name: "<-- Hit this after completing the task."
});

const defaultItems = [item1, item2, item3];

//Item.insertMany(defaultItems);

//Item.deleteMany({ name: 'Welcome to your todoList!'});



app.get("/", function(req, res) {
  Item.find({}) // the {} find all the items.
    .then(foundItems => res.render("list", {listTitle: "Today", newListItems: foundItems}))
    .catch(error => console.log(error));
});


app.post("/", async function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({name: listName});
      if (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      } else {
        console.log("List not found");
      }
    } catch (err) {
      console.log(err);
    }
  }
});
  

app.post("/delete", function(req, res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemID)
  .then(console.log("REMOVED ITEM"))
  .catch(error => console.log(error));
  res.redirect("/");
  } else{
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items:{_id : checkedItemID}}}
    ).then(function(foundList, err){
      if(!err){
        res.redirect("/" + listName);
      } else{
        console.log(err);
      }
    })
  }


  
});


app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName) // store the customListName parameter in a const

  List.findOne({ name: customListName })
    .then(foundList => {
      if (!foundList) {
        // create new list
        const list = List.create({
          name: customListName,
          items: defaultItems
        })
        .then(list => {
          res.redirect("/" + customListName);
        })
        .catch(err => console.log(err));
      } else {
        // show existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(err => console.log(err));
  // const list = new List({
  //   name: customListName,
  //   items: defaultItems
  // });
})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
