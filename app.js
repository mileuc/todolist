//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

//console.log(date);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//create todolistDB
mongoose.connect("mongodb+srv://admin-michael:test123@cluster0.u4fpw.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});
//mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

// set up schema for item documents in items collection
const itemsSchema = new mongoose.Schema({
    name: String
});

// create default page items collection
const Item = mongoose.model("Item", itemsSchema);

// set up default list items
const item1 = new Item({
    name: "Welcome to your to-do list!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// set up schema for list documents in lists collection
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

//create lists collection
const List = mongoose.model("List", listSchema);

//default page
app.get("/", function(req, res) {
    const day = date.getDate();
    //find all the items in the items collection in todolistDB
    Item.find({}, function(err, foundItems){
        if(err) {
            console.log(err);
        }
        else {
            //if there are no items in the items collection/default page, insert the default items, then render the page again
            if(foundItems.length === 0){
                Item.insertMany(defaultItems, function(err){
                    if(err) {
                        console.log(err);
                    }
                    else {
                        console.log("Successfully saved all the items to todolistDB");
                    }
                });
                res.redirect("/");
            }
            //if there are items in the items collection/default page, then simply render the page
            else {
                res.render("list", {listTitle: day, newListItems: foundItems});
            }
        }
    });
});

//adding an item to a list
app.post("/", function(req, res) {
    const day = date.getDate();
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });
    //if we are in the default page, add the item and render the page
    if (listName === day){
        item.save();
        res.redirect("/");
    }
    //if we are not in the default page, find the custom list, add the item into it's items array, and render the page
    else {
        List.findOne({name: listName}, function(err, foundList) {
            if(!err){
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            }
        });
    }
});

//deleting an item from a list
app.post("/delete", function(req, res) {
    const day = date.getDate();
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    //if we are in the default list, find the item by it's id and remove it from the items collection
    if(listName === day) {
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(err) {
                console.log(err);
            }
            else {
                console.log("Successfully deleted checked item.");
                res.redirect("/");
            }
        });
    }
    //if we are not in the default list, tap into specified custom list from the list collection, tap into it's items array, and remove the item according to it's id. Render the custom list.
    else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err) {
                res.redirect("/" + listName);
            }
        });
    }
});

////displaying an existing custom list or creating a new custom list
app.get("/:customListName", function(req, res) {
    //capitalize the custom list name
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err) {
            //creating a new custom list if it doesn't exist
            if(!foundList) {
                // Create a new list
                // console.log("Doesn't exist.");
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
            
                list.save();
                res.redirect("/" + customListName);
            }
            //render an existing custom list if it exists
            else {
                // Show an existing list
                // console.log("Exists.");
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
        else {
            console.log(err);
        }
    });
});

//displaying an existing list or creating a new list from the search bar
app.post("/add", function(req, res){
    const customListName = req.body.listName; //list name entered in the search bar
    res.redirect("/" + customListName); //use the list name as a route parameter and redirect to either create a new list or display an existing one
});

// app.post("/work", function(req, res) {
//     let workItem = req.body.newItem;
//     workItems.push(workItem);
//     res.redirect("/work");
// });

// app.get("/about", function(req, res) {
//     res.render("about");
// });
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function(){
    console.log("Server started on port 3000.");
});