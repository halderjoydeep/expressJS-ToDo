const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
// const date = require("./date.js");

const app = express();
mongoose.connect(
  'mongodb+srv://user:password@cluster0.i8lbsh5.mongodb.net/todolistDB'
);

const itemsSchema = mongoose.Schema({
  name: String,
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to our ToDoList',
});

const item2 = new Item({
  name: 'Hit the + button to add a new item',
});

const item3 = new Item({
  name: '<--- Hit this to delete an item',
});

const defaultItems = [item1, item2, item3];

// const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  // res.render("list", { listTitle: date.getDate(), listItems: items });
  Item.find((err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect('/');
        }
      });
    } else {
      res.render('list', { listTitle: 'Today', listItems: foundItems });
    }
  });
});

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model('List', listSchema);

app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (foundList === null) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        res.render('list', {
          listTitle: customListName,
          listItems: foundList.items,
        });
      }
    }
  });
});

app.post('/', (req, res) => {
  const listName = req.body.list;
  const itemName = req.body.newItem;
  const item = new Item({ name: itemName });
  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect('/' + listName);
      }
    });
  }
});

app.post('/delete', (req, res) => {
  const listName = req.body.list;
  const checkedItemId = req.body.checkbox;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect('/' + listName);
        }
      }
    );
  }
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.listen(3000, () => {
  console.log('Server started at port 3000');
});
