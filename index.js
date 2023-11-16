require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const fs = require('fs');
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

function dataManagement(action, input) {
  let filePath = './public/data.json';

  if (!fs.existsSync(filePath)) {
    fs.closeSync(fs.openSync(filePath, 'w'));
  }

  let file = fs.readFileSync(filePath);

  if (action == 'save data' && input != null) {
    if (file.length == 0) {
      fs.writeFileSync(filePath, JSON.stringify([input], null, 2));
    } else {
      let data = JSON.parse(file.toString());
      let inputExist = [];
      inputExist = data.map(d => d.original_url);
      let check_input = inputExist.includes(input.original_url);

      if (check_input === false) {
        data.push(input);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      }
    }
  } else if (action == 'load data' && input == null) {
    if (file.length == 0) { return; }
    else {
      let dataArray = JSON.parse(file);
      return dataArray;
    }
  }
}

function gen_shorturl() {
  let all_Data = dataManagement('load data');
  let min = 1;
  let max = 1000;

  if (all_Data != undefined && all_Data.length > 0) { max = all_Data.length * 1000; }
  else { max = 1000; }

  let short = Math.ceil(Math.random() * (max - min + 1) + min);

  if (all_Data === undefined) { return short; }
  else {
    let shortExist = all_Data.map(d => d.short_url);
    let check_short = shortExist.includes(short);

    if (check_short) { gen_shorturl(); }
    else { return short; }
  }
}

app.post('/api/shorturl', (req, res) => {
  let input = '', domain = '', param = '', short = 0;

  input = req.body.url;

  if (input === null || input === '') {
    return res.json({ error: 'invalid url' });
  }

  domain = input.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/igm);
  param = domain[0].replace(/^https?:\/\//i, "");

  dns.lookup(param, (err, url_Ip) => {
    if (err) {
      console.log(url_Ip);
      return res.json({ error: 'invalid url' });
    }
    else {
      short = gen_shorturl();
      dict = { original_url: input, short_url: short };
      dataManagement("save data", dict);
      return res.json(dict);
    }
  });
});

app.get('/api/shorturl/:shorturl', (req, res) => {
  let input = Number(req.params.shorturl);
  let all_Data = dataManagement('load data');

  let shortExist = all_Data.map(d => d.short_url);
  let check_short = shortExist.includes(input);

  if (check_short && all_Data != undefined) {
    data_found = all_Data[shortExist.indexOf(input)];
    res.redirect(data_found.original_url);
  }
  else {
    res.json({ data: 'No matching data', short: input, existing: shortExist });
  }
});

app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
